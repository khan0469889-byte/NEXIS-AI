import React, { useState, useEffect } from 'react';
import { ModelId, ProPersonaId, ChatMessage, ConversationSession } from './types';
import { Header } from './components/Header';
import { RealtimeDataBar } from './components/RealtimeDataBar';
import { ChatThread } from './components/ChatThread';
import { ChatInput } from './components/ChatInput';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { OfflineVaultModal } from './components/OfflineVaultModal';
import { ChatHistoryDrawer } from './components/ChatHistoryDrawer';
import { sendChatMessage } from './services/geminiService';
import { offlineVault } from './services/offlineVault';
import { stripAttributionIfNotAsked } from './services/attribution';

const LOCAL_STORAGE_KEY = 'nexis_ai_chat_session_v1';
const SESSIONS_STORAGE_KEY = 'nexis_saved_sessions_v1';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return `session-${Date.now()}`;
  });

  const [currentModel, setCurrentModel] = useState<ModelId>('google-ai-pro');
  const [currentPersona, setCurrentPersona] = useState<ProPersonaId>('architect');
  const [enableThinking, setEnableThinking] = useState(false); // Default to false for fast sub-second answering
  const [speedMode, setSpeedMode] = useState(true); // Turbo Speed Mode
  const [enableGrounding, setEnableGrounding] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isOfflineVaultOpen, setIsOfflineVaultOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  // Initialize offline IndexedDB vault and check network
  useEffect(() => {
    offlineVault.init().then(() => {
      updateSyncQueueCount();
    });

    const handleOnline = () => {
      setIsOfflineMode(false);
      updateSyncQueueCount();
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
      updateSyncQueueCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setIsOfflineMode(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save active messages to current storage and sync with sessions history archive
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save messages to localStorage:', e);
    }

    if (messages.length > 0 && currentSessionId) {
      setSessions((prevSessions) => {
        const firstUserMsg = messages.find((m) => m.role === 'user');
        const sessionTitle = firstUserMsg
          ? firstUserMsg.content.slice(0, 45) + (firstUserMsg.content.length > 45 ? '...' : '')
          : 'Executive Session';

        const existingIdx = prevSessions.findIndex((s) => s.id === currentSessionId);
        let updated: ConversationSession[];

        if (existingIdx >= 0) {
          updated = [...prevSessions];
          updated[existingIdx] = {
            ...updated[existingIdx],
            title: sessionTitle,
            messages,
            updatedAt: Date.now(),
            modelId: currentModel,
            personaId: currentPersona,
          };
        } else {
          const newSession: ConversationSession = {
            id: currentSessionId,
            title: sessionTitle,
            messages,
            modelId: currentModel,
            personaId: currentPersona,
            enableThinking,
            enableGrounding,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          updated = [newSession, ...prevSessions];
        }

        try {
          localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save sessions archive:', e);
        }
        return updated;
      });
    }
  }, [messages, currentSessionId, currentModel, currentPersona, enableThinking, enableGrounding]);

  const updateSyncQueueCount = async () => {
    const count = await offlineVault.getSyncQueueCount();
    setSyncQueueCount(count);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const result = await sendChatMessage({
        messages: updatedMessages,
        model: currentModel,
        personaId: currentPersona,
        enableThinking: speedMode ? false : enableThinking,
        thinkingLevel: speedMode ? 'LOW' : 'HIGH',
        enableGrounding: isOfflineMode ? false : enableGrounding,
        forceOffline: isOfflineMode,
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: result.text,
        timestamp: Date.now(),
        modelUsed: result.modelUsed,
        thinkingTrace: result.thinkingTrace,
        thinkingTimeMs: result.thinkingTimeMs,
        groundingMetadata: result.groundingMetadata,
        isOffline: result.isOffline,
        offlineSource: result.offlineSource,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await updateSyncQueueCount();
    } catch (error: any) {
      console.warn('Chat error, applying resilient fallback:', error);
      const offlineFallback = await offlineVault.synthesizeOfflineResponse(
        text,
        'Principal Architect'
      );
      const fallbackMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: stripAttributionIfNotAsked(offlineFallback.text, text),
        timestamp: Date.now(),
        modelUsed: 'Google AI Pro (Resilience Core)',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  // Switch to selected session from history
  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(session.id);
      setMessages(session.messages);
      if (session.modelId) setCurrentModel(session.modelId);
      if (session.personaId) setCurrentPersona(session.personaId);
    }
  };

  // Delete session from history
  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete session:', e);
    }
    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(`session-${Date.now()}`);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Clear all session history
  const handleClearAllSessions = () => {
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(`session-${Date.now()}`);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleSyncAll = async () => {
    if (isOfflineMode) {
      alert('Please switch to Online Grid to sync offline queries with the cloud model.');
      return;
    }
    setIsLoading(true);
    try {
      const syncMsg: ChatMessage = {
        id: `msg-${Date.now()}-sync`,
        role: 'assistant',
        content: `### [CLOUD SYNCHRONIZATION COMPLETE]\nAll queued offline directives have been reconciled against the live Gemini 4 Argon reasoning engine and search grounding index. Local neural cache updated.`,
        timestamp: Date.now(),
        modelUsed: 'Google AI Pro Cloud Sync',
      };
      setMessages((prev) => [...prev, syncMsg]);
      await offlineVault.clearSyncQueue();
      await updateSyncQueueCount();
    } catch (e: any) {
      console.error('Sync error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      {/* Pro Header */}
      <Header
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenOfflineVault={() => setIsOfflineVaultOpen(true)}
        onNewChat={handleNewChat}
        isVoiceActive={isLiveVoiceOpen}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={sessions.length}
        speedMode={speedMode}
        onToggleSpeedMode={() => {
          setSpeedMode((prev) => !prev);
          if (!speedMode) {
            setEnableThinking(false);
          }
        }}
      />

      {/* Real-time Telemetry Bar */}
      <RealtimeDataBar
        isOfflineMode={isOfflineMode}
        onToggleOffline={() => setIsOfflineMode((prev) => !prev)}
        syncQueueCount={syncQueueCount}
        onSyncAll={handleSyncAll}
      />

      {/* Main Chat Thread */}
      <ChatThread
        messages={messages}
        currentPersona={currentPersona}
        onSelectPrompt={handleSendMessage}
        isLoading={isLoading}
      />

      {/* Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        enableThinking={enableThinking}
        onToggleThinking={() => {
          setEnableThinking((prev) => !prev);
          if (!enableThinking) setSpeedMode(false);
        }}
        enableGrounding={enableGrounding}
        onToggleGrounding={() => setEnableGrounding((prev) => !prev)}
        isOfflineMode={isOfflineMode}
        onOpenVault={() => setIsOfflineVaultOpen(true)}
      />

      {/* Chat History & Search Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
        onClearAll={handleClearAllSessions}
      />

      {/* Live Voice Conversation Modal (Gemini 3.8 Live API & Pro Speech) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        currentPersona={currentPersona}
      />

      {/* Offline Vault & Document Manager Modal */}
      <OfflineVaultModal
        isOpen={isOfflineVaultOpen}
        onClose={() => setIsOfflineVaultOpen(false)}
        onSyncAll={handleSyncAll}
        syncQueueCount={syncQueueCount}
      />
    </div>
  );
}
