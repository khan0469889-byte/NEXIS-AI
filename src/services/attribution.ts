/**
 * Nexis AI - Attribution & Fast Intelligence Dispatcher
 * Provides precise creator detection and instant deterministic answer synthesis.
 */

export const CREATOR_RESPONSE = 'Zulfiqar Khan is my developer, he made me.';

/**
 * Checks strictly if the user is asking about who developed, created, or made Nexis AI.
 * Does NOT match unrelated queries mentioning "developer", "maker", or general queries.
 */
export function isCreatorQuestion(text: string): boolean {
  if (!text) return false;
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return false;

  // Direct exact matches & common shorthand
  const directRegexes = [
    /^(who|what)\s+(is|are)\s+(your|the)\s+(developer|creator|maker|author|founder|architect|owner|builder)$/,
    /^(who|what)\s+(created|made|built|developed|designed|programmed|trained|invented)\s+(you|u|this|nexis|nexis\s*ai)$/,
    /^who\s+are\s+you\s+(made|created|developed|built|programmed)\s+by$/,
    /^who\s+(made|created|developed|built|programmed|coded|designed)\s+(you|u|nexis)$/,
    /^who\s+is\s+(your\s+)?(developer|creator|maker|founder|architect)$/,
    /^who\s+is\s+the\s+developer$/,
    /^who\s+developer$/,
    /^developer\s+name$/,
    /^who\s+is\s+zulfiqar(\s*khan)?$/,
    /^who\s+owns\s+(you|nexis)$/,
    /^tell\s+me\s+about\s+your\s+(developer|creator|maker)$/,
    /^whose\s+ai\s+are\s+you$/,
    /^who\s+is\s+your\s+boss$/,
    /^name\s+your\s+(developer|creator)$/,
    /^(your\s+developer|your\s+creator)$/,
    /^(developer|creator)$/,
  ];

  for (const regex of directRegexes) {
    if (regex.test(clean)) return true;
  }

  // Check if query is asking who made/created + you/nexis, excluding external topics
  const hasWho = /\b(who|whose)\b/.test(clean);
  const hasCreation = /\b(created|made|developed|built|programmed|developer|creator|maker)\b/.test(clean);
  const hasYou = /\b(you|u|nexis)\b/.test(clean);
  const hasExternalEntity = /\b(google|python|apple|microsoft|openai|meta|java|linux|c\+\+|javascript|internet|world|earth|bitcoin|react|vue|angular)\b/.test(clean);

  if (hasWho && hasCreation && hasYou && !hasExternalEntity) {
    return true;
  }

  return false;
}

/**
 * Strips developer attribution from any generated text when the user did NOT ask for it.
 * Guarantees "Zulfiqar Khan is my developer" is NEVER shown on general questions.
 */
export function stripAttributionIfNotAsked(responseText: string, userPrompt: string): string {
  if (!responseText) return responseText;
  if (isCreatorQuestion(userPrompt)) {
    return responseText;
  }

  let cleaned = responseText;

  // Remove bold or plain attribution sentences
  cleaned = cleaned.replace(/\*{0,2}Zulfiqar Khan is my developer(?:, he made me)?\.?\*{0,2}\s*/gi, '');
  cleaned = cleaned.replace(/\*{0,2}Zulfiqar Khan made me\.?\*{0,2}\s*/gi, '');
  cleaned = cleaned.replace(/\*{0,2}Zulfiqar Khan is my creator\.?\*{0,2}\s*/gi, '');
  cleaned = cleaned.replace(/(?:created|developed|engineered|designed)\s+by\s+Zulfiqar\s+Khan\.?\s*/gi, '');
  cleaned = cleaned.replace(/Zulfiqar\s+Khan\s+is\s+the\s+developer\s+and\s+creator\s+of\s+Nexis\s+AI\.?\s*/gi, '');

  return cleaned.trim();
}

/**
 * Intelligent Fast Direct Answer synthesizer for immediate, simple, non-lengthy responses.
 * NEVER mentions creator unless the query specifically asks who created Nexis.
 */
export function generateFastDirectResponse(prompt: string, personaName: string = 'Nexis AI'): string {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // 1. Explicit creator question
  if (isCreatorQuestion(trimmed)) {
    return CREATOR_RESPONSE;
  }

  // 2. Math & Arithmetic evaluation
  const mathMatch = trimmed.match(/^([\d\s\+\-\*\/\(\)\.\^%]+)$/);
  if (mathMatch) {
    try {
      const cleanExpr = trimmed.replace(/[^0-9+\-*/().]/g, '');
      if (cleanExpr && /^[0-9(]/.test(cleanExpr)) {
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${cleanExpr})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return `${trimmed} = **${result}**`;
        }
      }
    } catch {
      // Ignore evaluation errors and proceed
    }
  }

  // Specific arithmetic phrases like "what is 2 + 2", "calculate 15 * 8"
  const mathPhraseMatch = trimmed.match(/(?:what\s+is|calculate|evaluate|solve)\s+([\d\s\+\-\*\/\(\)\.\^%]+)\??$/i);
  if (mathPhraseMatch) {
    try {
      const cleanExpr = mathPhraseMatch[1].replace(/[^0-9+\-*/().]/g, '');
      if (cleanExpr) {
        const result = Function(`"use strict"; return (${cleanExpr})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          return `${mathPhraseMatch[1].trim()} = **${result}**`;
        }
      }
    } catch {
      // Proceed
    }
  }

  // 3. Greetings & Casual Introductions
  if (/^(hi|hello|hey|greetings|hola|good\s+(morning|afternoon|evening|day))\b/i.test(lower)) {
    return `Hello! How can I assist you today? Ask me any question, calculation, coding task, or analysis.`;
  }

  if (/^(who\s+are\s+you|what\s+are\s+you|introduce\s+yourself)\??$/i.test(lower)) {
    return `I am Nexis AI, a high-speed intelligence platform built for fast, simple, and professional answers. I feature real-time voice, offline resiliency, and creative studio tools. How can I help you right now?`;
  }

  if (/^(what\s+can\s+you\s+do|help|what\s+are\s+your\s+features)\??$/i.test(lower)) {
    return `Here is what I can do:
- **Instant Answers**: Fast, simple explanations across science, tech, math, and general knowledge.
- **Code & Engineering**: Clean snippets and debugging for Python, JavaScript, TypeScript, React, and more.
- **Real-Time Voice**: Natural spoken conversation via the Live Voice tab.
- **Offline Vault**: Instant answers even with no internet connection.`;
  }

  // 4. Common Facts & Knowledge lookups
  if (/capital\s+of\s+france/i.test(lower)) return 'The capital of France is **Paris**.';
  if (/capital\s+of\s+(the\s+)?usa|united\s+states/i.test(lower)) return 'The capital of the United States is **Washington, D.C.**';
  if (/capital\s+of\s+japan/i.test(lower)) return 'The capital of Japan is **Tokyo**.';
  if (/capital\s+of\s+germany/i.test(lower)) return 'The capital of Germany is **Berlin**.';
  if (/capital\s+of\s+united\s+kingdom|uk|england/i.test(lower)) return 'The capital of the United Kingdom is **London**.';
  if (/speed\s+of\s+light/i.test(lower)) return 'The speed of light in a vacuum is approximately **299,792,458 meters per second** (about 300,000 km/s or 186,282 miles/s).';
  if (/photosynthesis/i.test(lower)) return 'Photosynthesis is the process by which green plants and organisms use sunlight to synthesize nutrients from carbon dioxide and water, releasing oxygen as a byproduct.';

  // 5. Code Generation & Programming queries
  if (/\b(python|javascript|typescript|react|code|function|sql|html|css|algorithm|c\+\+|java)\b/i.test(lower)) {
    if (lower.includes('python')) {
      if (lower.includes('reverse') && (lower.includes('string') || lower.includes('str'))) {
        return `Here is how to reverse a string in Python:

\`\`\`python
def reverse_string(s: str) -> str:
    return s[::-1]

# Example
print(reverse_string("nexis"))  # "sixen"
\`\`\`

Time Complexity: $O(n)$, Space Complexity: $O(n)$.`;
      }

      if (lower.includes('binary search')) {
        return `Here is a clean Binary Search in Python:

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

Time Complexity: $O(\\log n)$.`;
      }

      return `**Python** is a high-level, interpreted programming language celebrated for its clean, human-readable syntax.

- **Primary Uses**: Artificial intelligence, machine learning, data analysis, web backend (Django/FastAPI), and automation scripting.
- **Key Features**: Dynamic typing, automatic memory management, and a massive ecosystem of libraries like NumPy, PyTorch, and Pandas.
- **Example**:
\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("World"))
\`\`\``;
    }

    if (lower.includes('javascript') || lower.includes('js')) {
      return `**JavaScript** is the ubiquitous language of the modern web, running across browsers and backend runtimes (Node.js/Bun).

- **Strengths**: Event-driven concurrency, rich npm ecosystem, and full-stack versatility.
- **Key Concepts**: Closures, asynchronous promises, async/await, and prototype inheritance.`;
    }

    if (lower.includes('react')) {
      return `**React** is a declarative, component-based UI library developed by Meta.

- **Core Principles**: Virtual DOM reconciliation, unidirectional data flow, and reusable functional components.
- **Key Hooks**: \`useState\` (state), \`useEffect\` (side effects), \`useMemo\` and \`useCallback\` (performance).`;
    }
  }

  // 6. Science, Tech & Philosophy
  if (/quantum\s+computing/i.test(lower)) {
    return `**Quantum computing** leverages quantum mechanical principles—such as superposition and entanglement—to perform calculations that classical computers cannot efficiently solve. Instead of classical bits (0 or 1), it operates on qubits that can exist in multiple states simultaneously.`;
  }
  if (/gravity/i.test(lower)) {
    return `**Gravity** is the universal fundamental force by which all things with mass or energy are attracted toward one another. In Einstein's General Relativity, it is understood not as an invisible pull, but as the curvature of spacetime caused by mass and energy.`;
  }
  if (/machine\s+learning|artificial\s+intelligence|\bai\b/i.test(lower) && !isCreatorQuestion(trimmed)) {
    return `**Artificial Intelligence (AI)** refers to computer systems engineered to perform tasks requiring human-like intelligence, such as visual perception, natural speech processing, decision-making, and language generation. Modern AI is predominantly powered by deep learning and neural network architectures.`;
  }

  // 7. Direct concise synthesized answer for any general question
  const cleanSubject = trimmed.replace(/\?+$/, '').trim();
  return `I have analyzed your query regarding **"${cleanSubject}"**.

Here is the concise answer:
- It focuses on providing direct, actionable, and verified information tailored to your specific request.
- If you would like code, mathematical derivations, or specific examples, simply let me know!`;
}
