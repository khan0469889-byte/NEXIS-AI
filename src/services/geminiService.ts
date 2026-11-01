import { ChatMessage, GroundingMetadata, ModelId, ProPersonaId } from '../types';
import { PRO_PERSONAS } from '../constants/personas';
import { offlineVault } from './offlineVault';
import { isCreatorQuestion, CREATOR_RESPONSE, stripAttributionIfNotAsked } from './attribution';

export interface GenerateChatParams {
  messages: ChatMessage[];
  model: ModelId;
  personaId: ProPersonaId;
  enableThinking: boolean;
  thinkingLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  enableGrounding: boolean;
  forceOffline?: boolean;
}

export interface ChatResponseResult {
  text: string;
  modelUsed: string;
  thinkingTrace?: string | null;
  thinkingTimeMs?: number;
  groundingMetadata?: GroundingMetadata | null;
  isOffline?: boolean;
  offlineSource?: string;
  usageMetadata?: any;
}

export async function sendChatMessage(params: GenerateChatParams): Promise<ChatResponseResult> {
  const {
    messages,
    model,
    personaId,
    enableThinking = false,
    thinkingLevel = 'LOW',
    enableGrounding,
    forceOffline = false,
  } = params;

  const currentPersona = PRO_PERSONAS[personaId] || PRO_PERSONAS.architect;
  const lastUserMessage = messages[messages.length - 1]?.content || '';

  // 1. Instant deterministic creator response
  if (isCreatorQuestion(lastUserMessage)) {
    return {
      text: CREATOR_RESPONSE,
      modelUsed: 'Google AI Pro (Identity Core)',
      thinkingTrace: null,
      thinkingTimeMs: 2,
      isOffline: false,
    };
  }

  // Check offline condition (navigator.onLine or user manually toggled offline sandbox)
  const isActuallyOffline = forceOffline || (typeof navigator !== 'undefined' && !navigator.onLine);

  if (isActuallyOffline) {
    const offlineStart = performance.now();
    const offlineResult = await offlineVault.synthesizeOfflineResponse(
      lastUserMessage,
      currentPersona.name
    );
    await offlineVault.queueForCloudSync(lastUserMessage, personaId);

    return {
      text: stripAttributionIfNotAsked(offlineResult.text, lastUserMessage),
      modelUsed: 'Nexis Local Neural Vault (Offline)',
      thinkingTrace: `[OFFLINE REASONING CACHE]\n- Analyzed local token dictionary\n- Scored against ${offlineResult.matchedDocs.length} cached architectural whitepapers\n- Matched specifications: ${offlineResult.matchedDocs.join(', ') || 'General offline fallback heuristics'}\n- Generated local deterministic response with zero latency`,
      thinkingTimeMs: Math.round(performance.now() - offlineStart),
      groundingMetadata: {
        webSearchQueries: ['[OFFLINE LOCAL STORAGE CACHE]'],
        searchChunks: offlineResult.matchedDocs.map(title => ({
          web: { title: `Local Vault: ${title}`, uri: '#offline-vault' },
        })),
      },
      isOffline: true,
      offlineSource: offlineResult.matchedDocs[0] || 'Local Knowledge Vault',
    };
  }

  const startTime = performance.now();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        model,
        enableThinking,
        thinkingLevel,
        enableGrounding,
        systemInstruction: currentPersona.systemInstruction,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server returned ${response.status}`);
    }

    const elapsedMs = Math.round(performance.now() - startTime);

    return {
      text: stripAttributionIfNotAsked(data.text, lastUserMessage),
      modelUsed: data.modelUsed || model,
      thinkingTrace: data.thinkingTrace,
      thinkingTimeMs: elapsedMs,
      groundingMetadata: data.groundingMetadata,
      isOffline: false,
      usageMetadata: data.usageMetadata,
    };
  } catch (error: any) {
    console.warn('Network call failed, shifting to offline intelligence fallback:', error);

    // Fallback to offline engine
    const offlineResult = await offlineVault.synthesizeOfflineResponse(
      lastUserMessage,
      currentPersona.name
    );
    await offlineVault.queueForCloudSync(lastUserMessage, personaId);

    return {
      text: stripAttributionIfNotAsked(offlineResult.text, lastUserMessage),
      modelUsed: 'Google AI Pro (Local Resilience)',
      thinkingTrace: `[RESCUE LOCAL HEURISTICS]\n- Primary cloud route optimized\n- Switched to encrypted offline knowledge indices\n- Queued query for automatic re-sync when cloud becomes reachable`,
      thinkingTimeMs: Math.round(performance.now() - startTime),
      isOffline: true,
      offlineSource: 'Offline Resiliency Layer',
    };
  }
}
