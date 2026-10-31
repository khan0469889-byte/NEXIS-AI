// Natural Speech Synthesis & Voice Recognition Engine
// Mimics natural human conversational cadence, prosody, and executive presence

export interface SpeechSettings {
  pitch: number;
  rate: number;
  voiceName: string;
  autoListenAfterSpeech: boolean;
  proPhrasing: boolean;
}

const PRO_INTRO_PHRASES = [
  'Understood.',
  'Affirmative; let us examine the parameters.',
  'Here is the executive assessment.',
  'Proceeding with architectural analysis.',
  'Understood; dissecting the first principles.',
];

export class SpeechSynthesisService {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isSpeaking = false;
  private isListening = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  
  public onSpeakingChange?: (speaking: boolean) => void;
  public onListeningChange?: (listening: boolean) => void;
  public onTranscript?: (text: string, isFinal: boolean) => void;
  public onAudioLevel?: (level: number) => void;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onListeningChange?.(true);
        };

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) {
            this.onTranscript?.(final.trim(), true);
          } else if (interim) {
            this.onTranscript?.(interim.trim(), false);
          }
        };

        this.recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
          this.isListening = false;
          this.onListeningChange?.(false);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onListeningChange?.(false);
        };
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer natural sounding English voices
    const preferredNames = [
      'Google UK English Female',
      'Google UK English Male',
      'Google US English',
      'Samantha',
      'Daniel',
      'Karen',
      'Arthur',
      'en-US-Neural2',
    ];

    for (const name of preferredNames) {
      const match = voices.find(v => v.name.includes(name) || v.lang === 'en-US' || v.lang === 'en-GB');
      if (match) {
        this.selectedVoice = match;
        break;
      }
    }

    if (!this.selectedVoice && voices.length > 0) {
      this.selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().filter(v => v.lang.startsWith('en'));
  }

  // Sanitize and humanize markdown text for spoken flow
  public formatForSpeech(markdownText: string, addProIntro: boolean = false): string {
    let clean = markdownText;

    // Convert code blocks to spoken cue
    clean = clean.replace(/```[\s\S]*?```/g, ' A dedicated production code implementation is displayed on your console. ');

    // Remove headers markdown ### -> spoken pause
    clean = clean.replace(/#{1,6}\s+(.*)/g, '$1. ');

    // Remove bullet points - * or -
    clean = clean.replace(/^\s*[-*+]\s+/gm, ' ');

    // Remove bold/italics
    clean = clean.replace(/[*_]{1,3}(.*?)[*_]{1,3}/g, '$1');

    // Remove markdown links [text](url) -> text
    clean = clean.replace(/\[(.*?)\]\(.*?\)/g, '$1');

    // Remove blockquotes >
    clean = clean.replace(/^>\s+/gm, '');

    // Normalize spacing
    clean = clean.replace(/\s+/g, ' ').trim();

    // Limit spoken length for natural conversational summary if text is gigantic (>1200 chars)
    if (clean.length > 1500) {
      const sentences = clean.split(/(?<=[.!?])\s+/);
      const spokenSentences = sentences.slice(0, 7);
      clean = spokenSentences.join(' ') + ' The comprehensive technical breakdown and implementation details are fully rendered in the console above.';
    }

    if (addProIntro && !clean.startsWith('Understood') && !clean.startsWith('Affirmative')) {
      const randomIntro = PRO_INTRO_PHRASES[Math.floor(Math.random() * PRO_INTRO_PHRASES.length)];
      clean = `${randomIntro} ${clean}`;
    }

    return clean;
  }

  public speak(
    text: string,
    options: {
      onEnd?: () => void;
      rate?: number;
      pitch?: number;
      voiceName?: string;
      addIntro?: boolean;
    } = {}
  ): void {
    if (!this.synth) return;

    this.stopSpeaking();

    const spokenText = this.formatForSpeech(text, options.addIntro ?? true);
    const utterance = new SpeechSynthesisUtterance(spokenText);

    if (options.voiceName) {
      const voices = this.synth.getVoices();
      const customVoice = voices.find(v => v.name === options.voiceName);
      if (customVoice) utterance.voice = customVoice;
    } else if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // Professional human conversational cadence: slightly deliberate rate, natural pitch
    utterance.rate = options.rate || 1.02;
    utterance.pitch = options.pitch || 0.98;

    let visualizerTimer: any = null;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.onSpeakingChange?.(true);

      // Simulate audio frequency ripples during speech
      visualizerTimer = setInterval(() => {
        const fakeLevel = 0.35 + Math.random() * 0.55;
        this.onAudioLevel?.(fakeLevel);
      }, 80);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
      this.onAudioLevel?.(0);
      if (visualizerTimer) clearInterval(visualizerTimer);
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
      this.onAudioLevel?.(0);
      if (visualizerTimer) clearInterval(visualizerTimer);
    };

    this.synth.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
      this.onAudioLevel?.(0);
    }
  }

  public startListening(): void {
    if (!this.recognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Edge, or a WebKit browser.');
      return;
    }
    this.stopSpeaking();
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition already started or busy:', e);
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
}

export const speechService = new SpeechSynthesisService();
