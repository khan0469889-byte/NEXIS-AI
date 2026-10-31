import React, { useEffect, useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Zap,
  Activity,
  Layers,
  PhoneOff,
  RotateCcw,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { liveVoiceService } from '../services/liveVoiceService';
import { speechService } from '../services/speechSynthesisService';
import { ProPersonaId } from '../types';
import { PRO_PERSONAS } from '../constants/personas';
import { isCreatorQuestion, CREATOR_RESPONSE, stripAttributionIfNotAsked } from '../services/attribution';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: ProPersonaId;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
}) => {
  const [activeVoiceMode, setActiveVoiceMode] = useState<'gemini-live' | 'natural-pro'>('gemini-live');
  const [voiceName, setVoiceName] = useState<'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'>('Zephyr');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'interrupted' | 'error'>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [inputTranscript, setInputTranscript] = useState('');
  const [outputTranscript, setOutputTranscript] = useState('');
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ sender: 'user' | 'nexis'; text: string }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const persona = PRO_PERSONAS[currentPersona] || PRO_PERSONAS.architect;

  // Initialize and handle live voice stream
  useEffect(() => {
    if (!isOpen) {
      handleStopAll();
      return;
    }

    if (activeVoiceMode === 'gemini-live') {
      startGeminiLiveSession();
    } else {
      startNaturalProSession();
    }

    return () => {
      handleStopAll();
    };
  }, [isOpen, activeVoiceMode, voiceName]);

  const startGeminiLiveSession = async () => {
    setErrorMessage(null);
    liveVoiceService.onStatusChange = (newStatus: any) => {
      if (newStatus === 'connected') setStatus('listening');
      else setStatus(newStatus);
    };

    liveVoiceService.onAudioLevel = (lvl) => {
      setAudioLevel(lvl);
    };

    liveVoiceService.onInputTranscript = (text) => {
      setInputTranscript(text);
      if (isCreatorQuestion(text)) {
        liveVoiceService.interrupt();
        setOutputTranscript(CREATOR_RESPONSE);
        setDialogueHistory((prev) => [
          ...prev,
          { sender: 'user', text },
          { sender: 'nexis', text: CREATOR_RESPONSE },
        ]);
        speechService.speak(CREATOR_RESPONSE, { addIntro: false });
        return;
      }

      setDialogueHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'user') {
          return [...prev.slice(0, -1), { sender: 'user', text }];
        }
        return [...prev, { sender: 'user', text }];
      });
    };

    liveVoiceService.onOutputTranscript = (text) => {
      let clean = text
        .replace(/created\s+by\s+google/gi, 'created by Zulfiqar Khan')
        .replace(/developed\s+by\s+google/gi, 'developed by Zulfiqar Khan')
        .replace(/trained\s+by\s+google/gi, 'trained by Zulfiqar Khan')
        .replace(/google\s+is\s+my\s+developer/gi, 'Zulfiqar Khan is my developer');

      // Strip developer attribution unless the user explicitly asked who the creator is
      clean = stripAttributionIfNotAsked(clean, inputTranscript);

      setOutputTranscript(clean);
      setDialogueHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'nexis') {
          return [...prev.slice(0, -1), { sender: 'nexis', text: clean }];
        }
        return [...prev, { sender: 'nexis', text: clean }];
      });
    };

    liveVoiceService.onError = (msg) => {
      setErrorMessage(msg);
      // If WebSocket fails, offer seamless switch to Natural Pro Voice
      if (msg.includes('Failed to initialize') || msg.includes('API_KEY')) {
        setActiveVoiceMode('natural-pro');
      }
    };

    await liveVoiceService.start(voiceName, currentPersona);
  };

  const startNaturalProSession = () => {
    setErrorMessage(null);
    setStatus('listening');

    speechService.onAudioLevel = (lvl) => {
      setAudioLevel(lvl);
    };

    speechService.onListeningChange = (listening) => {
      if (listening) setStatus('listening');
    };

    speechService.onSpeakingChange = (speaking) => {
      if (speaking) setStatus('speaking');
      else setStatus('listening');
    };

    speechService.onTranscript = async (transcript, isFinal) => {
      setInputTranscript(transcript);
      if (isFinal && transcript.trim().length > 0) {
        setDialogueHistory((prev) => [...prev, { sender: 'user', text: transcript }]);
        setStatus('speaking');

        if (isCreatorQuestion(transcript)) {
          setOutputTranscript(CREATOR_RESPONSE);
          setDialogueHistory((prev) => [...prev, { sender: 'nexis', text: CREATOR_RESPONSE }]);
          speechService.speak(CREATOR_RESPONSE, {
            addIntro: false,
            onEnd: () => {
              if (!isMuted) speechService.startListening();
            },
          });
          return;
        }

        // Query server for answer
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: transcript }],
              model: 'google-ai-pro',
              systemInstruction: `${persona.systemInstruction}\nKeep spoken replies concise, professional, and conversational.`,
            }),
          });
          const data = await res.json();
          const spokenReply = data.text || 'Understood.';
          setOutputTranscript(spokenReply);
          setDialogueHistory((prev) => [...prev, { sender: 'nexis', text: spokenReply }]);

          speechService.speak(spokenReply, {
            addIntro: true,
            onEnd: () => {
              if (!isMuted) speechService.startListening();
            },
          });
        } catch (err: any) {
          const fallback = 'I have analyzed your request. Please inspect parameters.';
          speechService.speak(fallback);
        }
      }
    };

    speechService.startListening();
  };

  const handleStopAll = () => {
    liveVoiceService.stop();
    speechService.stopSpeaking();
    speechService.stopListening();
    setStatus('idle');
  };

  const handleInterrupt = () => {
    if (activeVoiceMode === 'gemini-live') {
      liveVoiceService.interrupt();
    } else {
      speechService.stopSpeaking();
      setStatus('listening');
      if (!isMuted) speechService.startListening();
    }
  };

  // Render glowing waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Base circle / neural orb
      const baseRadius = 55;
      const orbRadius = baseRadius + audioLevel * 30;

      // Background gradient radial
      const grad = ctx.createRadialGradient(
        width / 2,
        centerY,
        10,
        width / 2,
        centerY,
        orbRadius * 1.6
      );
      if (status === 'speaking') {
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (status === 'listening') {
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.45)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, 'rgba(148, 163, 184, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(width / 2, centerY, orbRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Multi-layer sine waves
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.lineWidth = 2.5 - w * 0.5;

        if (status === 'speaking') {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 - w * 0.25})`;
        } else if (status === 'listening') {
          ctx.strokeStyle = `rgba(52, 211, 153, ${0.9 - w * 0.25})`;
        } else {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
        }

        for (let x = 0; x < width; x += 4) {
          const amp = 8 + audioLevel * 45;
          const freq = 0.015 + w * 0.005;
          const y = centerY + Math.sin(x * freq + phase + w * 1.5) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += 0.06 + audioLevel * 0.12;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [audioLevel, status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-950/95 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                  NEXIS LIVE VOICE CONVERSATION
                </h3>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300">
                  {activeVoiceMode === 'gemini-live' ? 'gemini-3.8-live' : 'Natural Pro Voice'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Persona: <span className="text-neutral-200 font-semibold">{persona.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5 text-xs">
              <button
                onClick={() => setActiveVoiceMode('gemini-live')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  activeVoiceMode === 'gemini-live'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Gemini Live API
              </button>
              <button
                onClick={() => setActiveVoiceMode('natural-pro')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  activeVoiceMode === 'natural-pro'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Continuous Pro
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Central Audio Visualizer Area */}
        <div className="relative flex flex-col items-center justify-center py-8 px-6 bg-gradient-to-b from-neutral-950 via-neutral-900/50 to-neutral-950">
          <canvas
            ref={canvasRef}
            width={520}
            height={200}
            className="w-full max-w-lg h-44 rounded-2xl"
          />

          {/* Real-time State Badge */}
          <div className="mt-3 flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/90 px-4 py-1.5 shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  status === 'speaking'
                    ? 'bg-cyan-400'
                    : status === 'listening'
                    ? 'bg-emerald-400'
                    : 'bg-neutral-500'
                }`}
              ></span>
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  status === 'speaking'
                    ? 'bg-cyan-500'
                    : status === 'listening'
                    ? 'bg-emerald-500'
                    : 'bg-neutral-400'
                }`}
              ></span>
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-200">
              {status === 'speaking'
                ? 'Nexis Speaking (24kHz)'
                : status === 'listening'
                ? 'Listening to Mic (16kHz)... Speak naturally'
                : status === 'connecting'
                ? 'Initializing Live Neural Stream...'
                : 'Standby'}
            </span>
          </div>

          {errorMessage && (
            <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-300">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Live Conversation Transcript Stream */}
        <div className="border-t border-neutral-800/80 bg-neutral-950/90 px-6 py-4 max-h-48 overflow-y-auto space-y-3 font-mono text-xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
            Live Bidirectional Audio Transcript Stream
          </div>

          {dialogueHistory.length === 0 && !inputTranscript && !outputTranscript ? (
            <p className="text-neutral-500 italic">
              Speak into your microphone. Nexis AI will respond with executive voice cadence and real-time reasoning.
            </p>
          ) : (
            dialogueHistory.slice(-4).map((item, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  item.sender === 'user' ? 'text-emerald-400' : 'text-cyan-300'
                }`}
              >
                <span className="font-bold shrink-0">
                  {item.sender === 'user' ? 'You:' : 'Nexis:'}
                </span>
                <span className="text-neutral-300">{item.text}</span>
              </div>
            ))
          )}

          {inputTranscript && (
            <div className="flex gap-2 text-emerald-400 opacity-80 animate-pulse">
              <span className="font-bold shrink-0">You (Interim):</span>
              <span className="text-neutral-300">{inputTranscript}</span>
            </div>
          )}
        </div>

        {/* Bottom Voice Controls */}
        <div className="flex flex-wrap items-center justify-between border-t border-neutral-800 bg-neutral-900/80 px-6 py-4 gap-3">
          {/* Voice Personality Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Voice:</span>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value as any)}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="Zephyr">Zephyr (Executive & Crisp)</option>
              <option value="Puck">Puck (Dynamic & Energetic)</option>
              <option value="Charon">Charon (Deep & Resonant)</option>
              <option value="Kore">Kore (Warm & Articulate)</option>
              <option value="Fenrir">Fenrir (Authoritative & Firm)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Conversational Interrupt Button */}
            <button
              onClick={handleInterrupt}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors cursor-pointer"
              title="Interrupt Nexis like a natural human conversation"
            >
              <VolumeX className="h-4 w-4 text-amber-400" />
              <span>Interrupt Voice</span>
            </button>

            {/* End Call / Close */}
            <button
              onClick={() => {
                handleStopAll();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-md shadow-rose-600/25 transition-all cursor-pointer"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
