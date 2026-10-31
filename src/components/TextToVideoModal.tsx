import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  X,
  Send,
  Clapperboard,
  Layers,
  Download,
  Settings2,
} from 'lucide-react';
import { VideoData } from '../types';
import { generateVideoStoryboard } from '../services/geminiService';
import { speechService } from '../services/speechSynthesisService';

interface TextToVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (videoData: VideoData) => void;
}

export const TextToVideoModal: React.FC<TextToVideoModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true);
  const [voiceName, setVoiceName] = useState<'Zephyr' | 'Kore' | 'Puck' | 'Charon'>('Zephyr');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const PRESETS = [
    {
      title: 'Neon Hyperloop City',
      prompt: 'A futuristic supersonic magnetic train gliding through a glowing glass tube over an illuminated cyberpunk city in 2088',
    },
    {
      title: 'Quantum Microcosm',
      prompt: 'Zooming deep into a quantum computing processor where atomic qubits oscillate in electromagnetic superposition with blue laser pulses',
    },
    {
      title: 'Mars Orbital Spaceport',
      prompt: 'Solar powered starships docking at a colossal rotating ring station orbiting red planetary dunes of Mars at twilight',
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    speechService.stopSpeaking();

    try {
      const result = await generateVideoStoryboard({
        prompt: prompt.trim(),
        voiceoverEnabled,
        voiceName,
        aspectRatio,
      });

      const video: VideoData = {
        title: result.title || prompt.slice(0, 40),
        prompt: prompt.trim(),
        scenes: result.scenes.map((s: any) => ({
          caption: s.caption || 'Cinematic Scene',
          narration: s.narration || prompt,
          duration: s.duration || 4,
          imageUrl: s.imageUrl,
        })),
        voiceoverEnabled,
        voiceName,
        aspectRatio,
      };

      setVideoData(video);
      setCurrentSceneIdx(0);
      setIsPlaying(true);
    } catch (e: any) {
      console.error('Video generation error:', e);
      alert('Failed to generate video storyboard: ' + (e.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Video scene playback and voiceover loop
  useEffect(() => {
    if (!isOpen || !videoData || !isPlaying) {
      speechService.stopSpeaking();
      return;
    }

    const currentScene = videoData.scenes[currentSceneIdx];
    if (!currentScene) return;

    // Trigger voiceover if enabled
    if (voiceoverEnabled && currentScene.narration) {
      speechService.stopSpeaking();
      speechService.speak(currentScene.narration, {
        addIntro: false,
        voiceName: voiceName === 'Zephyr' ? undefined : undefined,
        rate: 1.0,
      });
    }

    const durationMs = (currentScene.duration || 4) * 1000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      setSceneProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        // Move to next scene
        if (currentSceneIdx < videoData.scenes.length - 1) {
          setCurrentSceneIdx((prev) => prev + 1);
        } else {
          // Loop or stop
          setIsPlaying(false);
          speechService.stopSpeaking();
        }
      }
    }, 50);

    return () => {
      clearInterval(interval);
      speechService.stopSpeaking();
    };
  }, [isOpen, videoData, isPlaying, currentSceneIdx, voiceoverEnabled, voiceName]);

  // Canvas visual rendering with cinematic camera motions & dynamic lighting
  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background gradient based on scene index
      const sceneColor = [
        ['#0b132b', '#1c2541', '#48cae4'],
        ['#1a0933', '#2d124d', '#7209b7'],
        ['#031d1f', '#064e3b', '#10b981'],
        ['#2b0c15', '#4d1927', '#e11d48'],
      ][currentSceneIdx % 4];

      const grad = ctx.createRadialGradient(
        w / 2 + Math.sin(time) * 40,
        h / 2 + Math.cos(time) * 30,
        20,
        w / 2,
        h / 2,
        w * 0.8
      );
      grad.addColorStop(0, sceneColor[2]);
      grad.addColorStop(0.5, sceneColor[1]);
      grad.addColorStop(1, sceneColor[0]);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Animated cinematic light particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 35; i++) {
        const px = ((i * 37 + time * 20) % w);
        const py = ((i * 73 + Math.sin(time + i) * 30 + h) % h);
        const pSize = 1 + (i % 3);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dynamic Perspective Grid / Horizon
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      const horizonY = h * 0.65;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.stroke();

      for (let x = -w; x <= w * 2; x += 60) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + (x - w / 2) * 0.2, horizonY);
        ctx.lineTo(x + Math.sin(time * 0.5) * 20, h);
        ctx.stroke();
      }

      // Vignette effect
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, currentSceneIdx]);

  const handlePostToChat = () => {
    if (!videoData) return;
    onInsertToChat(videoData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl rounded-3xl border border-neutral-800 bg-neutral-950/95 shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                  TEXT-TO-VIDEO STUDIO
                </h3>
                <span className="rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                  VOICEOVER READY
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Generate animated multi-scene sequences with optional AI narration
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              speechService.stopSpeaking();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
              <span>Video Concept / Storyline</span>
              <span className="text-[11px] text-neutral-500">What story or motion scene should Nexis render?</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A futuristic quantum spaceport orbiting Jupiter where exploratory probes launch towards Europa..."
              rows={3}
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/90 p-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-violet-500/70 focus:outline-none focus:ring-1 focus:ring-violet-500/50 leading-relaxed"
            />
          </div>

          {/* Quick Concept Presets */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span>Storyline Starters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p.prompt)}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs text-neutral-300 hover:border-violet-500/50 hover:text-violet-200 transition-colors cursor-pointer"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Voiceover & Aspect Ratio Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-neutral-800/90 bg-neutral-900/40 p-4">
            {/* Voiceover ON/OFF Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  {voiceoverEnabled ? (
                    <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-neutral-500" />
                  )}
                  <span>AI Voiceover Narration</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  voiceoverEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {voiceoverEnabled ? 'VOICEOVER: ON' : 'VOICEOVER: OFF'}
                </span>
              </div>

              {/* The Toggle Button */}
              <button
                type="button"
                onClick={() => setVoiceoverEnabled(!voiceoverEnabled)}
                className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  voiceoverEnabled
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 shadow-sm shadow-emerald-500/15'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>{voiceoverEnabled ? 'Voiceover Enabled (Spoken Audio)' : 'Voiceover Disabled (Silent Video)'}</span>
                <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${voiceoverEnabled ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${voiceoverEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              {voiceoverEnabled && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">Narrator:</span>
                  <select
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value as any)}
                    className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 py-1 px-2.5 text-xs text-neutral-200 focus:outline-none"
                  >
                    <option value="Zephyr">Zephyr (Executive & Crisp)</option>
                    <option value="Kore">Kore (Warm & Articulate)</option>
                    <option value="Puck">Puck (Dynamic & Cinematic)</option>
                    <option value="Charon">Charon (Deep & Resonant)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <span className="block text-xs font-semibold text-neutral-200 mb-2">
                Video Format & Aspect Ratio
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'border-violet-500 bg-violet-500/20 text-violet-300 shadow-sm shadow-violet-500/20'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>{ratio}</div>
                    <div className="text-[10px] text-neutral-500 font-normal">
                      {ratio === '16:9' ? 'Widescreen' : ratio === '9:16' ? 'Reels/Shorts' : 'Square'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all cursor-pointer shadow-lg ${
              prompt.trim() && !isGenerating
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/25'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <Clapperboard className="h-4 w-4 animate-spin" />
                <span>Directing Scenes & Generating Storyboard...</span>
              </>
            ) : (
              <>
                <Clapperboard className="h-4 w-4" />
                <span>Generate Video with {voiceoverEnabled ? 'Voiceover' : 'No Voiceover'}</span>
              </>
            )}
          </button>

          {/* Interactive Video Player & Storyboard Canvas */}
          {videoData && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate max-w-sm">
                    {videoData.title}
                  </span>
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-violet-400">
                    Scene {currentSceneIdx + 1} of {videoData.scenes.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVoiceoverEnabled(!voiceoverEnabled)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold border cursor-pointer ${
                      voiceoverEnabled ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-neutral-800 text-neutral-500'
                    }`}
                  >
                    {voiceoverEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    <span>{voiceoverEnabled ? 'Voiceover Active' : 'Muted'}</span>
                  </button>
                </div>
              </div>

              {/* Video Screen Container */}
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-black aspect-video flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                />

                {/* Subtitle Caption Overlay */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="inline-block rounded-xl bg-black/75 backdrop-blur-md px-4 py-2 border border-white/10 max-w-xl">
                    <p className="text-xs font-bold text-amber-300 font-['Space_Grotesk'] mb-0.5">
                      {videoData.scenes[currentSceneIdx]?.caption}
                    </p>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                      &ldquo;{videoData.scenes[currentSceneIdx]?.narration}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Top Watermark */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/10">
                  <Film className="h-3 w-3 text-violet-400" />
                  <span>NEXIS CINEMATIC VIDEO</span>
                </div>
              </div>

              {/* Timeline Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Scene {currentSceneIdx + 1} / {videoData.scenes.length}</span>
                  <span>{Math.round(sceneProgress * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-100 rounded-full"
                    style={{
                      width: `${((currentSceneIdx + sceneProgress) / videoData.scenes.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Video Player Controls */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        setIsPlaying(false);
                        speechService.stopSpeaking();
                      } else {
                        setIsPlaying(true);
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentSceneIdx(0);
                      setSceneProgress(0);
                      setIsPlaying(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Replay Video from start"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handlePostToChat}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 text-xs font-bold hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/25 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Video to Chat Thread</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
