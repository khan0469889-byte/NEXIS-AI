import React, { useState } from 'react';
import { ChatMessage, ProPersonaId } from '../types';
import { PRO_PERSONAS } from '../constants/personas';
import { ThinkingTraceAccordion } from './ThinkingTraceAccordion';
import { speechService } from '../services/speechSynthesisService';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Globe,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  Download,
  Film,
  Play,
  Pause,
  Image as ImageIcon,
} from 'lucide-react';

interface ChatThreadProps {
  messages: ChatMessage[];
  currentPersona: ProPersonaId;
  onSelectPrompt: (prompt: string) => void;
  isLoading: boolean;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  currentPersona,
  onSelectPrompt,
  isLoading,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const activePersona = PRO_PERSONAS[currentPersona] || PRO_PERSONAS.architect;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePlayAudio = (message: ChatMessage) => {
    if (playingMessageId === message.id) {
      speechService.stopSpeaking();
      setPlayingMessageId(null);
    } else {
      speechService.stopSpeaking();
      setPlayingMessageId(message.id);
      speechService.speak(message.content, {
        addIntro: true,
        onEnd: () => setPlayingMessageId(null),
      });
    }
  };

  const PRO_PROMPT_CARDS = [
    {
      title: 'Who is your developer?',
      persona: 'Lead Architect',
      prompt: 'Who created you and who is your developer?',
      badge: 'CREATOR',
    },
    {
      title: 'Distributed Systems Explained Simply',
      persona: 'Principal Systems Architect',
      prompt: 'Explain distributed consensus (Raft) simply in 2 minutes with key takeaways.',
      badge: 'ARCH-LEAD',
    },
    {
      title: 'How AI Attention Works',
      persona: 'Chief AI Research Scientist',
      prompt: 'Explain how transformer attention works in simple, clear terms with an intuitive analogy.',
      badge: 'RESEARCH',
    },
    {
      title: 'High-Performance Code Tips',
      persona: 'Staff Systems Engineer',
      prompt: 'Give me 3 practical tips for writing high-performance, clean async code with short examples.',
      badge: 'STAFF-SWE',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {messages.length === 0 ? (
          /* Empty State / Pro Prompts Showcase */
          <div className="py-8 sm:py-12">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Executive Intelligence Terminal Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 font-['Space_Grotesk']">
                How may Nexis AI assist your architectural directive?
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Nexis integrates <span className="text-cyan-400 font-medium">Gemini 4 Argon High-Thinking</span>, live Google Search grounding, human-like 24kHz voice dialogue, and offline IndexedDB resilience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRO_PROMPT_CARDS.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt(card.prompt)}
                  className="group relative flex flex-col text-left rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 hover:border-cyan-500/50 hover:bg-neutral-900 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-cyan-500/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300 font-mono">
                      {card.badge}
                    </span>
                    <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-white mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                    {card.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation Thread */
          messages.map((message) => {
            const isUser = message.role === 'user';
            const isPlayingThis = playingMessageId === message.id;

            return (
              <div
                key={message.id}
                className={`flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* Message Meta Info */}
                <div className="flex items-center gap-2 mb-1.5 px-1 text-xs text-neutral-400">
                  {isUser ? (
                    <span className="font-semibold text-neutral-300">You (Executive Principal)</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-bold text-cyan-400">
                        <Cpu className="h-3.5 w-3.5" />
                        <span>NEXIS AI</span>
                      </span>
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">
                        {message.modelUsed || 'Gemini 4 Argon'}
                      </span>
                      {message.isOffline && (
                        <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-mono flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Offline Vault</span>
                        </span>
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-neutral-500">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Message Body Box */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-full sm:max-w-3xl ${
                    isUser
                      ? 'bg-neutral-800 text-neutral-100 border border-neutral-700/80'
                      : 'bg-neutral-900/90 text-neutral-200 border border-neutral-800 shadow-xl backdrop-blur-md'
                  }`}
                >
                  {/* Thinking Process Accordion (if present) */}
                  {!isUser && message.thinkingTrace && (
                    <ThinkingTraceAccordion
                      trace={message.thinkingTrace}
                      timeMs={message.thinkingTimeMs}
                      modelUsed={message.modelUsed}
                    />
                  )}

                  {/* Formatted Content */}
                  {message.content && (
                    <div className="prose prose-invert max-w-none text-sm text-neutral-200 space-y-3 font-normal whitespace-pre-wrap leading-relaxed break-words">
                      {message.content}
                    </div>
                  )}

                  {/* Render Generated Image (Nano Banana) */}
                  {message.imageUrl && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-amber-500/30 bg-black/80 p-2 space-y-2">
                      <div className="flex items-center justify-between text-xs text-amber-300 font-semibold px-2 pt-1">
                        <span className="flex items-center gap-1.5 font-['Space_Grotesk']">
                          <span>🍌</span>
                          <span>Nano Banana Generated Image</span>
                        </span>
                        <a
                          href={message.imageUrl}
                          download={`nano-banana-${message.id}.png`}
                          className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          <span>Save PNG</span>
                        </a>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                        <img
                          src={message.imageUrl}
                          alt="Nano Banana Output"
                          className="w-full max-h-[420px] object-contain rounded-xl hover:scale-[1.01] transition-transform duration-200 cursor-pointer"
                          onClick={() => window.open(message.imageUrl, '_blank')}
                        />
                      </div>
                    </div>
                  )}

                  {/* Render Generated Video (Text to Video with Voiceover) */}
                  {message.videoData && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-violet-500/30 bg-neutral-950 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-violet-300 font-semibold">
                        <span className="flex items-center gap-1.5 font-['Space_Grotesk']">
                          <Film className="h-4 w-4 text-violet-400" />
                          <span>Cinematic Video Storyboard</span>
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                          message.videoData.voiceoverEnabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {message.videoData.voiceoverEnabled ? 'VOICEOVER: ON' : 'VOICEOVER: OFF'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-3 text-xs space-y-2">
                        <p className="font-bold text-white text-sm">
                          {message.videoData.title}
                        </p>
                        <div className="space-y-1.5">
                          {message.videoData.scenes.map((scene, sIdx) => (
                            <div key={sIdx} className="rounded-lg bg-neutral-950 p-2.5 border border-neutral-800/80">
                              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 font-mono mb-1">
                                <span>Scene {sIdx + 1}: {scene.caption}</span>
                                <span className="text-neutral-500">{scene.duration}s</span>
                              </div>
                              <p className="text-neutral-300 text-xs italic">
                                &ldquo;{scene.narration}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grounding Citations (if search was used) */}
                  {!isUser && message.groundingMetadata?.searchChunks && message.groundingMetadata.searchChunks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-neutral-800/80">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 mb-2">
                        <Globe className="h-3.5 w-3.5" />
                        <span>Verified Real-Time Grounding Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.groundingMetadata.searchChunks.slice(0, 4).map((chunk, cIdx) => {
                          const uri = chunk.web?.uri;
                          const title = chunk.web?.title || uri || 'Reference Document';
                          if (!uri) return null;

                          return (
                            <a
                              key={cIdx}
                              href={uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-950/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
                            >
                              <span className="truncate max-w-[200px]">{title}</span>
                              <ExternalLink className="h-3 w-3 text-neutral-500" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  {!isUser && (
                    <div className="mt-3.5 pt-2.5 flex items-center justify-between border-t border-neutral-800/60 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        {/* Spoken Cadence Player */}
                        <button
                          onClick={() => handleTogglePlayAudio(message)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                            isPlayingThis
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-neutral-800/70 hover:bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {isPlayingThis ? (
                            <>
                              <VolumeX className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                              <span>Stop Spoken Brief</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5 text-neutral-400" />
                              <span>Listen Spoken Brief</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Copy Action */}
                      <button
                        onClick={() => handleCopy(message.id, message.content)}
                        className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                        title="Copy Response"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md">
              <Cpu className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 text-xs text-neutral-300 shadow-md">
              <div className="flex items-center gap-2 font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                </span>
                <span className="text-cyan-400 font-semibold tracking-wide">
                  NEXIS SYNAPSE DELIBERATING...
                </span>
              </div>
              <p className="mt-1 text-neutral-400">
                Formulating architectural breakdown and checking real-time grounding verification...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
