import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Cpu, Sparkles } from 'lucide-react';

interface ThinkingTraceAccordionProps {
  trace: string;
  timeMs?: number;
  modelUsed?: string;
}

export const ThinkingTraceAccordion: React.FC<ThinkingTraceAccordionProps> = ({
  trace,
  timeMs,
  modelUsed,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!trace) return null;

  return (
    <div className="mb-4 rounded-xl border border-violet-500/25 bg-violet-950/20 backdrop-blur-sm overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-violet-300 hover:bg-violet-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/20 text-violet-400">
            <Brain className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <span className="font-semibold tracking-wide uppercase text-[11px] text-violet-200">
            High Reasoning Thought Trace
          </span>
          <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300 border border-violet-500/30">
            {modelUsed?.includes('argon') ? 'Gemini 4 Argon' : 'High-Thinking'}
          </span>
          {timeMs && (
            <span className="text-[11px] text-violet-400/80 font-mono">
              ({timeMs}ms deliberation)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-violet-400">
          <span className="text-[11px]">{isOpen ? 'Collapse Trace' : 'Inspect Reasoning'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-violet-500/20 bg-neutral-950/70 p-4 text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto selection:bg-violet-500/30">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-800 text-[10px] uppercase text-neutral-400 tracking-wider">
            <Cpu className="h-3 w-3 text-violet-400" />
            <span>Internal Deliberation Chain & First Principles Formulation</span>
          </div>
          {trace}
        </div>
      )}
    </div>
  );
};
