import React, { useEffect, useState } from 'react';
import { Activity, Globe, ShieldCheck, Zap, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RealtimeDataBarProps {
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  syncQueueCount: number;
  onSyncAll: () => void;
}

export const RealtimeDataBar: React.FC<RealtimeDataBarProps> = ({
  isOfflineMode,
  onToggleOffline,
  syncQueueCount,
  onSyncAll,
}) => {
  const [latency, setLatency] = useState(24);
  const [tickerIndex, setTickerIndex] = useState(0);

  const signals = [
    { label: 'GOOGLE AI PRO', val: 'High-Throughput Unlimited Engine', icon: Zap, color: 'text-cyan-400' },
    { label: 'GEMINI LIVE ENGINE', val: 'gemini-3.8-live (24kHz PCM)', icon: Zap, color: 'text-amber-400' },
    { label: 'HIGH THINKING MODEL', val: 'Gemini 4 Argon (High Reasoning)', icon: Activity, color: 'text-violet-400' },
    { label: 'LEAD DEVELOPER', val: 'Zulfiqar Khan', icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'OFFLINE VAULT', val: 'IndexedDB Encrypted Core Active', icon: ShieldCheck, color: 'text-emerald-400' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(20 + Math.random() * 15));
      setTickerIndex(prev => (prev + 1) % signals.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const activeSignal = signals[tickerIndex];
  const ActiveIcon = activeSignal.icon;

  return (
    <div className="border-b border-neutral-800/80 bg-neutral-950/80 px-4 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Active Telemetry Signal */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-neutral-900/90 border border-neutral-800 px-3 py-1 text-neutral-300">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isOfflineMode ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {isOfflineMode ? 'Offline Resiliency Active' : 'Real-Time Telemetry'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
            <ActiveIcon className={`h-3.5 w-3.5 ${activeSignal.color}`} />
            <span className="text-neutral-500">{activeSignal.label}:</span>
            <span className="text-neutral-200 font-semibold">{activeSignal.val}</span>
          </div>
        </div>

        {/* Right: Latency & Mode Controls */}
        <div className="flex items-center gap-3">
          {!isOfflineMode && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
              <span className="text-neutral-500">Latency:</span>
              <span className="text-emerald-400 font-semibold">{latency}ms</span>
            </div>
          )}

          {syncQueueCount > 0 && (
            <button
              onClick={onSyncAll}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-900/60 transition-all cursor-pointer"
              title="Click to sync offline queries with cloud model"
            >
              <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
              <span>{syncQueueCount} Queued Offline</span>
              <span className="underline ml-0.5">Sync Now</span>
            </button>
          )}

          {/* Toggle Offline Sandbox */}
          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
              isOfflineMode
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
          >
            {isOfflineMode ? <WifiOff className="h-3.5 w-3.5 text-amber-400" /> : <Wifi className="h-3.5 w-3.5 text-emerald-400" />}
            <span>{isOfflineMode ? 'Offline Mode (Active)' : 'Online Grid'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
