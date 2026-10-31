import React from 'react';
import { ModelId, ProPersonaId } from '../types';
import { PRO_PERSONAS } from '../constants/personas';
import {
  Sparkles,
  Mic,
  Database,
  RotateCcw,
  Cpu,
  Brain,
  Shield,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  currentModel: ModelId;
  onSelectModel: (m: ModelId) => void;
  currentPersona: ProPersonaId;
  onSelectPersona: (p: ProPersonaId) => void;
  onOpenLiveVoice: () => void;
  onOpenOfflineVault: () => void;
  onNewChat: () => void;
  isVoiceActive: boolean;
  onOpenHistory: () => void;
  historyCount: number;
  speedMode: boolean;
  onToggleSpeedMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  onSelectModel,
  currentPersona,
  onSelectPersona,
  onOpenLiveVoice,
  onOpenOfflineVault,
  onNewChat,
  isVoiceActive,
  onOpenHistory,
  historyCount,
  speedMode,
  onToggleSpeedMode,
}) => {
  const persona = PRO_PERSONAS[currentPersona] || PRO_PERSONAS.architect;

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-violet-700 shadow-lg shadow-cyan-500/20">
            <Cpu className="h-5 w-5 text-white" />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-950 text-[9px] font-bold text-cyan-400 border border-neutral-800">
              4
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-['Space_Grotesk']">
                NEXIS <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
              </h1>
              <span className="rounded-md bg-cyan-950/80 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 tracking-wider">
                PRO UNLIMITED
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Developed by Zulfiqar Khan • Real-Time Grounding • Live Voice • Turbo Latency
            </p>
          </div>
        </div>

        {/* Model Tier & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Turbo Speed Fast-Response Toggle */}
          <button
            onClick={onToggleSpeedMode}
            type="button"
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              speedMode
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-amber-500/20'
                : 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:text-neutral-200'
            }`}
            title={speedMode ? 'Turbo Speed Active: Sub-second instantaneous answers' : 'Deep Thinking Mode: High deliberation time'}
          >
            <Sparkles className={`h-3.5 w-3.5 ${speedMode ? 'text-amber-400 animate-pulse' : 'text-neutral-500'}`} />
            <span className="hidden xs:inline">{speedMode ? '⚡ Turbo Fast' : 'Deep Reasoning'}</span>
          </button>

          {/* Search History Button */}
          <button
            onClick={onOpenHistory}
            type="button"
            className="relative flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
            title="Search Previous Chat History"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/40 px-1 text-[9px] font-bold font-mono text-cyan-300">
                {historyCount}
              </span>
            )}
          </button>

          {/* Model Selector */}
          <div className="relative hidden md:block">
            <select
              value={currentModel}
              onChange={(e) => onSelectModel(e.target.value as ModelId)}
              className="appearance-none rounded-xl border border-neutral-800 bg-neutral-900/90 py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-200 shadow-sm hover:border-neutral-700 focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              <option value="google-ai-pro">⚡ Google AI Pro (Unlimited & Fast)</option>
              <option value="gemini-4-argon">🧠 Gemini 4 Argon (Deep Thinking)</option>
              <option value="gemini-3.8-flash">💎 Gemini 3.8 Flash (Balanced Pro)</option>
              <option value="gemini-3.1-flash-lite">🚀 Gemini 3.1 Flash Lite (Ultra Fast)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Persona Selector */}
          <div className="relative hidden lg:block">
            <select
              value={currentPersona}
              onChange={(e) => onSelectPersona(e.target.value as ProPersonaId)}
              className="appearance-none rounded-xl border border-neutral-800 bg-neutral-900/90 py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-200 shadow-sm hover:border-neutral-700 focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              {Object.values(PRO_PERSONAS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.badge} — {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Real Voice Dialogue Button */}
          <button
            onClick={onOpenLiveVoice}
            className={`group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-md ${
              isVoiceActive
                ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-500/20'
            }`}
          >
            <div className="relative">
              <Mic className="h-3.5 w-3.5" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>
            <span className="hidden sm:inline">Live Voice</span>
          </button>

          {/* Offline Vault Button */}
          <button
            onClick={onOpenOfflineVault}
            title="Open Offline Knowledge Vault"
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Vault</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            title="Start New Pro Session"
            className="flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/80 p-2 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
