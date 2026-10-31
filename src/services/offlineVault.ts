import { OfflineDocument, ChatMessage } from '../types';
import { isCreatorQuestion, CREATOR_RESPONSE, generateFastDirectResponse } from './attribution';

const DB_NAME = 'nexis_offline_vault_db';
const DB_VERSION = 1;

// Default pre-cached high-value pro knowledge corpus
const SEED_OFFLINE_DOCUMENTS: OfflineDocument[] = [
  {
    id: 'doc-creator-zulfiqar',
    title: 'System Creator & Lead Architect: Zulfiqar Khan',
    category: 'custom-knowledge',
    summary: 'Zulfiqar Khan is the developer and creator of Nexis AI. He engineered the architecture, model orchestration, voice engines, and offline resiliency.',
    content: `# Nexis AI Engineering Specification: Creator & Lead Developer
## 1. Executive Attribution
**Zulfiqar Khan is my developer, he made me.**

Nexis AI was conceived, designed, and developed by **Zulfiqar Khan**. He designed the full-stack architecture uniting Gemini 4 Argon High-Reasoning, Gemini 3.8 Live bidirectional 24kHz voice interaction, real-time Google Search grounding, and the encrypted offline IndexedDB vault.

## 2. Core Architectural Vision
- **Authoritative & Professional Pro Excellence**: Designed to explain complex topics with principal-level clarity and mathematical precision.
- **Resilient Multi-Modal Core**: Seamless zero-latency offline heuristic fallback combined with cloud high-thinking reasoning.
- **Natural Human Cadence**: Built-in conversational flow, dynamic interruption handling, and acoustic spectrum processing.`,
    tags: ['developer', 'creator', 'zulfiqar-khan', 'architecture', 'nexis-ai'],
    lastModified: Date.now(),
  },
  {
    id: 'doc-dist-consensus',
    title: 'Distributed Consensus & Raft State Machines',
    category: 'distributed-systems',
    summary: 'Core mechanics of leader election, log replication, safety invariants, and joint consensus configuration changes.',
    content: `# Distributed Consensus: Raft vs. Paxos Engineering Blueprint
## 1. Executive Summary
Raft decomposes consensus into three independent subproblems: Leader Election, Log Replication, and Safety. It guarantees linearizable state machine replication across $2f + 1$ nodes surviving $f$ Byzantine-free failures.

## 2. Invariants & Mechanics
- **Election Safety**: At most one leader can be elected in a given term.
- **Leader Append-Only**: A leader never overwrites or truncates its log; it only appends new entries.
- **Log Matching Property**: If two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index.
- **Leader Completeness**: If a log entry is committed in a given term, then that entry will be present in the logs of the leaders for all higher-numbered terms.

## 3. Production Hardening
To prevent split-vote deadlocks in WAN clusters:
- Randomized election timers between $150\\text{ms} - 300\\text{ms}$.
- Heartbeat broadcast interval: $\\approx 50\\text{ms}$.
- Pre-vote protocol: Candidate checks if peers would grant a vote before incrementing its term to prevent disrupted nodes from resetting the cluster term.`,
    tags: ['raft', 'consensus', 'distributed-systems', 'fault-tolerance'],
    lastModified: Date.now(),
  },
  {
    id: 'doc-transformer-attn',
    title: 'Modern Transformer Architecture & Attention Optimization',
    category: 'ai-algorithms',
    summary: 'Mathematical breakdown of Scaled Dot-Product Attention, FlashAttention tiling, RoPE, and KV Cache memory footprint.',
    content: `# Modern Transformer Attention Mechanics & Memory Scaling
## 1. Mathematical Formulation
Scaled Dot-Product Attention operates over Query ($Q$), Key ($K$), and Value ($V$) projections:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

## 2. FlashAttention-2 I/O Optimization
Standard attention materializes an $N \\times N$ intermediate attention matrix in High Bandwidth Memory (HBM), yielding $O(N^2)$ memory reads/writes. FlashAttention tiles $Q, K, V$ into SRAM blocks (typically $64 \\times 64$ or $128 \\times 128$) and applies online softmax rescaling:
- Avoids quadratic memory footprint on HBM.
- Accelerates computation by achieving $>70\\%$ theoretical FLOP utilization on modern tensor cores.

## 3. KV Cache Latency & Memory
During autoregressive generation, past Key and Value vectors are cached to prevent recomputing previous tokens. Memory footprint for sequence length $L$, layers $N_l$, heads $N_h$, and head dim $d_k$:
$$\\text{KV Cache Size} = 2 \\times N_l \\times N_h \\times d_k \\times L \\times \\text{precision (bytes)}$$
Grouped-Query Attention (GQA) shares $K/V$ heads across query heads, drastically reducing bandwidth bottlenecks.`,
    tags: ['transformers', 'attention', 'flash-attention', 'kv-cache', 'llm-engineering'],
    lastModified: Date.now(),
  },
  {
    id: 'doc-zero-trust',
    title: 'Zero-Trust Architecture & Ephemeral Identity Verification',
    category: 'security',
    summary: 'Mutual TLS (mTLS), SPIFFE/SPIRE workload identities, and token-bound attestation for cloud-native zero trust.',
    content: `# Zero-Trust Architecture: Workload Identity & Ephemeral Credentials
## 1. Core Architectural Tenet
"Never trust, always verify." Perimeter-based security is obsolete. All inter-service communications must be authenticated, authorized, and encrypted at the application transport layer.

## 2. SPIFFE/SPIRE Implementation
- **SPIFFE ID**: Cryptographically verifiable URI: \`spiffe://domain.com/ns/production/sa/payment-service\`
- **SVID (SPIFFE Verifiable Identity Document)**: Short-lived X.509 certificate (TTL 1 hour) rotated automatically.
- **Hardware Attestation**: TPM 2.0 or AWS Nitro Enclave roots of trust authenticate node bootstrapping before distributing signing keys.

## 3. Defense-in-Depth Principles
- End-to-end mTLS with TLS 1.3 only, enforcing modern cipher suites (AES-GCM-256 or ChaCha20-Poly1305).
- Fine-grained attribute-based access control (ABAC) with Open Policy Agent (OPA) gatekeepers.`,
    tags: ['security', 'zero-trust', 'spiffe', 'mtls', 'cryptography'],
    lastModified: Date.now(),
  },
  {
    id: 'doc-high-perf-concurrency',
    title: 'Lock-Free Ring Buffers & Zero-Copy Event Loops',
    category: 'architecture',
    summary: 'Disruptor pattern, cache-line padding, memory barriers, and mechanical sympathy for extreme low-latency systems.',
    content: `# Mechanical Sympathy & High-Throughput Concurrency
## 1. The Bottleneck of Locks
OS mutexes invoke kernel context switches costing $1\\mu\\text{s} - 5\\mu\\text{s}$. In high-frequency telemetry processing, this thrashes CPU pipeline and L1/L2 caches.

## 2. Lock-Free Single-Producer Single-Consumer (SPSC) Ring Buffer
- Fixed power-of-two capacity permits atomic sequence wrapping with bitwise AND: \`index & (capacity - 1)\`.
- Cache-line padding ($64$ bytes on x86-64, $128$ bytes on Apple Silicon) prevents False Sharing between producer head and consumer tail.
- Memory fences: Acq-Rel (Acquire-Release) ordering guarantees visibility without total store ordering overhead.

## 3. Benchmarks
- SPSC Lock-Free Queue: 25-50 million operations/sec with $<20\\text{ns}$ p99 latency.
- Mutex-guarded Queue: 1.2 million operations/sec with $>800\\text{ns}$ jitter.`,
    tags: ['concurrency', 'low-latency', 'lock-free', 'performance', 'systems'],
    lastModified: Date.now(),
  },
];

class OfflineVaultService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('category', 'category', { unique: false });
          docStore.createIndex('tags', 'tags', { multiEntry: true });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        await this.seedInitialDocuments();
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        reject(new Error('Failed to open offline IndexedDB vault.'));
      };
    });
  }

  private async seedInitialDocuments(): Promise<void> {
    const existing = await this.getAllDocuments();
    if (existing.length === 0) {
      for (const doc of SEED_OFFLINE_DOCUMENTS) {
        await this.saveDocument(doc);
      }
    }
  }

  async getAllDocuments(): Promise<OfflineDocument[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve([]);
      const tx = this.db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveDocument(doc: OfflineDocument): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const req = store.put(doc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteDocument(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const tx = this.db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Fast offline inverted keyword & semantic scoring search
  async searchOfflineVault(query: string): Promise<{ doc: OfflineDocument; score: number }[]> {
    const docs = await this.getAllDocuments();
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) {
      return docs.map(d => ({ doc: d, score: 1 }));
    }

    const scored = docs.map(doc => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const summaryLower = doc.summary.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const tagsJoined = doc.tags.join(' ').toLowerCase();

      for (const term of terms) {
        if (titleLower.includes(term)) score += 12;
        if (tagsJoined.includes(term)) score += 8;
        if (summaryLower.includes(term)) score += 4;
        const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
        score += Math.min(matches, 10);
      }

      return { doc, score };
    });

    return scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  }

  // Offline Heuristic Engine: answers queries cleanly using local knowledge & fast direct synthesis
  async synthesizeOfflineResponse(prompt: string, personaName: string): Promise<{ text: string; matchedDocs: string[] }> {
    // 1. Strict creator question check
    if (isCreatorQuestion(prompt)) {
      return {
        text: CREATOR_RESPONSE,
        matchedDocs: ['Creator & Lead Architect: Zulfiqar Khan'],
      };
    }

    // 2. Search offline vault, filtering out creator doc if not asking about creator
    const searchResults = await this.searchOfflineVault(prompt);
    const validMatches = searchResults.filter(m => m.doc.id !== 'doc-creator-zulfiqar').slice(0, 2);

    if (validMatches.length > 0) {
      const primaryDoc = validMatches[0].doc;
      const synthesis = `**[Quick Answer]**

${primaryDoc.summary}

- **Reference**: ${primaryDoc.title}`;
      return { text: synthesis, matchedDocs: validMatches.map(m => m.doc.title) };
    }

    // 3. Fast direct smart answer tailored to user prompt (never mentions creator unless asked)
    const directAnswer = generateFastDirectResponse(prompt, personaName);
    return { text: directAnswer, matchedDocs: [] };
  }

  // Queue item for sync when back online
  async queueForCloudSync(prompt: string, personaId: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.add({ prompt, personaId, createdAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSyncQueueCount(): Promise<number> {
    await this.init();
    return new Promise((resolve) => {
      if (!this.db) return resolve(0);
      const tx = this.db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  }

  async clearSyncQueue(): Promise<void> {
    await this.init();
    return new Promise((resolve) => {
      if (!this.db) return resolve();
      const tx = this.db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.clear();
      tx.oncomplete = () => resolve();
    });
  }
}

export const offlineVault = new OfflineVaultService();
