import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Brain,
  Globe,
  Mic,
  MicOff,
  Sparkles,
  Database,
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
}) => {
  const [text, setText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Setup dictation listener
  useEffect(() => {
    speechService.onTranscript = (transcript, isFinal) => {
      if (isFinal) {
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    speechService.onListeningChange = (listening) => {
      setIsDictating(listening);
    };
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

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
    } else {
      speechService.startListening();
    }
  };

  return (
    <div className="sticky bottom-0 z-20 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pb-6 pt-3 px-4">
      <div className="mx-auto max-w-4xl space-y-2">
        {/* Controls Bar: Mode Pills & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Real-time Search Grounding Toggle */}
            <button
              type="button"
              onClick={onToggleGrounding}
              disabled={isOfflineMode}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all cursor-pointer border ${
                enableGrounding && !isOfflineMode
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-sm shadow-cyan-500/20'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
              } ${isOfflineMode ? 'opacity-40 cursor-not-allowed' : ''}`}
              title="Real-time web search grounding via Google Search"
            >
              <Globe className={`h-3.5 w-3.5 ${enableGrounding ? 'animate-pulse text-cyan-400' : ''}`} />
              <span>Real-Time Web Search</span>
              {enableGrounding && !isOfflineMode && (
                <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            {/* High-Reasoning Thinking Toggle */}
            <button
              type="button"
              onClick={onToggleThinking}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all cursor-pointer border ${
                enableThinking
                  ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/20'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
              }`}
              title="Toggle Deep Multi-Step Thinking Trace"
            >
              <Brain className={`h-3.5 w-3.5 ${enableThinking ? 'text-indigo-400' : ''}`} />
              <span>Deep Thinking</span>
              {enableThinking && (
                <span className="rounded bg-indigo-500/20 text-indigo-300 px-1 py-0.2 text-[9px] font-mono">
                  HIGH
                </span>
              )}
            </button>

            {/* Offline Vault Access Pill */}
            <button
              type="button"
              onClick={onOpenVault}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all cursor-pointer border ${
                isOfflineMode
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-300 animate-pulse'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
              }`}
            >
              <Database className="h-3.5 w-3.5 text-amber-400" />
              <span>Offline Vault</span>
              {isOfflineMode && (
                <span className="rounded bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[9px] font-mono font-bold">
                  ACTIVE
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 hidden sm:block">
            Shift + Enter for new line • Enter to execute
          </div>
        </div>

        {/* Input Textarea Container */}
        <div className="relative flex items-end rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-2xl focus-within:border-cyan-500/70 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all pl-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isDictating
                ? 'Listening to your voice... Speak your query...'
                : isOfflineMode
                ? 'Query the local encrypted offline vault (works with zero internet)...'
                : 'Prompt Nexis AI (e.g. Ask any question, science, coding, math, architecture)...'
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
