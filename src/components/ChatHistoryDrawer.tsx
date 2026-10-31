import React, { useState, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  Trash2,
  Plus,
  X,
  Clock,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import { ConversationSession } from '../types';

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onClearAll: () => void;
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sessions by title or any message content
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchMessage = s.messages.some((m) =>
        m.content.toLowerCase().includes(q)
      );
      return matchTitle || matchMessage;
    });
  }, [sessions, searchQuery]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-md h-full bg-neutral-950 border-r border-neutral-800 shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                CHAT ARCHIVE & SEARCH
              </h3>
              <p className="text-[11px] text-neutral-400">
                {sessions.length} saved conversations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous chats, topics, or keywords..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-8 text-xs text-neutral-100 placeholder-neutral-500 focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-[11px] text-cyan-400 font-mono">
              Found {filteredSessions.length} matching session{filteredSessions.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              {searchQuery ? (
                <>
                  <p>No chat history matches &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-cyan-400 underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                </>
              ) : (
                <p>No archived conversations yet. Start a chat!</p>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const lastMsg = session.messages[session.messages.length - 1]?.content || 'Empty session';

              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between rounded-xl p-3 text-xs transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-neutral-900 border-cyan-500/40 text-white shadow-sm'
                      : 'border-transparent text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200 hover:border-neutral-800'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-neutral-200 truncate group-hover:text-cyan-300 transition-colors">
                        {session.title || 'Conversation'}
                      </span>
                      <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[9px] font-mono text-neutral-400 shrink-0">
                        {session.messages.length} msgs
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate leading-relaxed">
                      {lastMsg}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(session.updatedAt || session.createdAt)}</span>
                      <span>•</span>
                      <span className="text-neutral-400">{session.modelId}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this chat from history?')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {sessions.length > 0 && (
          <div className="border-t border-neutral-800/80 p-3 bg-neutral-950 flex items-center justify-between text-xs text-neutral-500">
            <span>{sessions.length} total sessions</span>
            <button
              onClick={() => {
                if (confirm('Clear all previous chat history? This cannot be undone.')) {
                  onClearAll();
                }
              }}
              className="text-[11px] text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
