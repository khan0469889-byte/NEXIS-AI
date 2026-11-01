export type ModelId = 'google-ai-pro' | 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.5-flash-lite' | 'gemini-3.5-flash' | 'gemini-3.8-live';

export type ProPersonaId = 'architect' | 'scientist' | 'engineer' | 'quant' | 'director';

export interface ProPersona {
  id: ProPersonaId;
  name: string;
  title: string;
  badge: string;
  tagline: string;
  avatarColor: string;
  systemInstruction: string;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  searchChunks?: Array<{ web?: GroundingSource }>;
  groundingSupports?: any[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: string;
  thinkingTrace?: string | null;
  thinkingTimeMs?: number;
  groundingMetadata?: GroundingMetadata | null;
  isOffline?: boolean;
  offlineSource?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: ModelId;
  personaId: ProPersonaId;
  enableThinking: boolean;
  enableGrounding: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface OfflineDocument {
  id: string;
  title: string;
  category: 'architecture' | 'distributed-systems' | 'ai-algorithms' | 'security' | 'custom-knowledge';
  summary: string;
  content: string;
  tags: string[];
  lastModified: number;
}

export interface LiveVoiceConfig {
  voiceName: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
  inputSampleRate: number;
  outputSampleRate: number;
  autoListen: boolean;
  interruptionSensitivity: number;
}
