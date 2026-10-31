import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Brain,
  Globe,
  Mic,
  MicOff,
  Sparkles,
  Paperclip,
  Database,
  Plus,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { speechService } from '../services/speechSynthesisService';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  enableThinking: boolean;
  onToggleThinking: () => void;
  enableGrounding: boolean;
  onToggleGrounding: () => void;
  isOfflineMode: boolean;
  onOpenVault: () => void;
  onOpenNanoBanana: () => void;
  onOpenTextToVideo: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  enableThinking,
  onToggleThinking,
  enableGrounding,
  onToggleGrounding,
  isOfflineMode,
  onOpenVault,
  onOpenNanoBanana,
  onOpenTextToVideo,
}) => {
  const [text, setText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  // Close plus menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusMenuOpen]);

  // Setup dictation listener
  useEffect(() => {
    speechService.onTranscript = (transcript, isFinal) => {
      setText((prev) => {
        const cleaned = prev ? `${prev} ${transcript}` : transcript;
        return cleaned;
      });
      if (isFinal) {
        setIsDictating(false);
      }
    };

    speechService.onListeningChange = (listening) => {
      setIsDictating(listening);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleToggleDictation = () => {
    if (isDictating) {
      speechService.stopListening();
      setIsDictating(false);
    } else {
      speechService.startListening();
      setIsDictating(true);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-grow textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  return (
    <div className="border-t border-neutral-800 bg-neutral-950/95 p-4 backdrop-blur-xl">
      <div className="mx-auto max-w-4xl space-y-2.5">
        {/* Toggle Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* High Thinking Toggle */}
            <button
              type="button"
              onClick={onToggleThinking}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium transition-all cursor-pointer ${
                enableThinking
                  ? 'border-violet-500/60 bg-violet-500/15 text-violet-300 shadow-sm shadow-violet-500/20'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
              }`}
              title="Activate Gemini 4 Argon High-Thinking Mode"
            >
              <Brain className={`h-3.5 w-3.5 ${enableThinking ? 'text-violet-400 animate-pulse' : 'text-neutral-400'}`} />
              <span>High Reasoning</span>
              {enableThinking && (
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
              )}
            </button>

            {/* Real-time Web Grounding Toggle */}
            <button
              type="button"
              onClick={onToggleGrounding}
              disabled={isOfflineMode}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium transition-all cursor-pointer ${
                isOfflineMode
                  ? 'border-neutral-800 bg-neutral-900/40 text-neutral-600 cursor-not-allowed'
                  : enableGrounding
                  ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
              }`}
              title={isOfflineMode ? 'Grounding disabled in Offline Mode' : 'Toggle Real-Time Google Search Grounding'}
            >
              <Globe className={`h-3.5 w-3.5 ${enableGrounding && !isOfflineMode ? 'text-cyan-400' : 'text-neutral-500'}`} />
              <span>Web Grounding</span>
              {enableGrounding && !isOfflineMode && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              )}
            </button>

            {/* Offline Vault Shortcut */}
            <button
              type="button"
              onClick={onOpenVault}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300 transition-colors cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span>Local Vault Context</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 hidden sm:block">
            Shift + Enter for new line • Enter to execute
          </div>
        </div>

        {/* Input Textarea Container */}
        <div className="relative flex items-end rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-2xl focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
          {/* Plus Icon Button with Studio Popover */}
          <div className="relative pb-2 pl-2" ref={plusMenuRef}>
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                isPlusMenuOpen
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-800'
              }`}
              title="Add Media: Nano Banana Picture or Text to Video"
            >
              <Plus className={`h-4 w-4 transition-transform duration-200 ${isPlusMenuOpen ? 'rotate-45 text-cyan-400' : ''}`} />
            </button>

            {/* Creative Studio Popover Menu */}
            {isPlusMenuOpen && (
              <div className="absolute bottom-12 left-0 z-50 w-72 rounded-2xl border border-neutral-700/80 bg-neutral-950/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-mono flex items-center justify-between">
                  <span>Creative Studios</span>
                  <span className="text-cyan-400">Nexis AI</span>
                </div>

                {/* Option 1: Nano Banana Picture */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    onOpenNanoBanana();
                  }}
                  className="w-full flex items-start gap-3 rounded-xl p-2.5 text-left hover:bg-neutral-900 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-lg group-hover:scale-110 transition-transform">
                    🍌
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Nano Banana
                      </span>
                      <span className="rounded bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[9px] font-mono font-bold">
                        MAKE PICTURE
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      Generate high-resolution AI pictures & artwork
                    </p>
                  </div>
                </button>

                {/* Option 2: Text to Video with Voiceover */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlusMenuOpen(false);
                    onOpenTextToVideo();
                  }}
                  className="w-full flex items-start gap-3 rounded-xl p-2.5 text-left hover:bg-neutral-900 border border-transparent hover:border-violet-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 group-hover:scale-110 transition-transform">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                        Text to Video
                      </span>
                      <span className="rounded bg-violet-500/20 text-violet-300 px-1 py-0.2 text-[9px] font-mono font-bold">
                        VOICEOVER
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      Make video with Voiceover ON / OFF option
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isDictating
                ? 'Listening to your voice... Speak your engineering query...'
                : isOfflineMode
                ? 'Query the local encrypted offline vault (works with zero internet)...'
                : 'Prompt Nexis AI (e.g. Architect a fault-tolerant Raft cluster, derive attention math, build lock-free buffer)...'
            }
            rows={1}
            disabled={isLoading}
            className="max-h-44 w-full resize-none bg-transparent px-3 py-3.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center gap-2 p-2.5">
            {/* Dictation Button */}
            <button
              type="button"
              onClick={handleToggleDictation}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                isDictating
                  ? 'border-rose-500 bg-rose-500/20 text-rose-400 animate-pulse'
                  : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
              title={isDictating ? 'Stop Dictation' : 'Start Voice Dictation'}
            >
              {isDictating ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || isLoading}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
                text.trim() && !isLoading
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
