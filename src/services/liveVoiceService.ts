// Gemini 3.8 Live API Audio Engine
// Handles 16kHz PCM capture and 24kHz PCM playback with gapless scheduling

export class LiveVoiceService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  
  // Callbacks
  public onInputTranscript?: (text: string) => void;
  public onOutputTranscript?: (text: string) => void;
  public onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error') => void;
  public onAudioLevel?: (level: number) => void;
  public onError?: (msg: string) => void;

  private isConnected = false;
  private isSpeaking = false;

  async start(voiceName: string = 'Zephyr', persona: string = 'architect'): Promise<void> {
    this.onStatusChange?.('connecting');

    try {
      // 1. Initialize Audio Contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      this.nextStartTime = this.outputAudioCtx.currentTime;

      // 2. Request mic permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 3. Connect WebSocket to /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${encodeURIComponent(voiceName)}&persona=${encodeURIComponent(persona)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.onStatusChange?.('connected');
        this.setupAudioCapture();
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.ready) {
            this.onStatusChange?.('listening');
          }

          if (msg.inputTranscript && this.onInputTranscript) {
            this.onInputTranscript(msg.inputTranscript);
          }

          if (msg.outputTranscript && this.onOutputTranscript) {
            this.onOutputTranscript(msg.outputTranscript);
          }

          if (msg.audio) {
            this.isSpeaking = true;
            this.onStatusChange?.('speaking');
            this.playPcmChunk(msg.audio);
          }

          if (msg.interrupted) {
            this.stopPlayback();
            this.onStatusChange?.('listening');
          }

          if (msg.error) {
            console.warn('Live API server message:', msg.error);
            if (this.onError) this.onError(msg.error);
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket Live error:', e);
        this.onStatusChange?.('error');
        this.onError?.('Failed to connect to Live Voice stream.');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onStatusChange?.('idle');
      };

    } catch (err: any) {
      console.error('Error starting Live voice service:', err);
      this.onStatusChange?.('error');
      this.onError?.(err.message || 'Microphone access denied or audio engine error.');
      this.stop();
    }
  }

  private setupAudioCapture() {
    if (!this.inputAudioCtx || !this.mediaStream) return;

    const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    // Buffer size 4096 = ~256ms at 16kHz
    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioCtx.destination);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Compute RMS for visualizer
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.onAudioLevel?.(Math.min(rms * 8, 1)); // scale to 0..1

      // Convert Float32 to 16-bit PCM little endian
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Convert to base64
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      this.ws.send(JSON.stringify({ audio: base64 }));
    };
  }

  private playPcmChunk(base64Pcm: string) {
    if (!this.outputAudioCtx) return;

    try {
      const binary = atob(base64Pcm);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);

      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);

      // Gapless scheduling
      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02; // 20ms safety lead
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
        if (this.activeSources.length === 0) {
          this.isSpeaking = false;
          this.onStatusChange?.('listening');
        }
      };
    } catch (e) {
      console.error('Error decoding/playing PCM chunk:', e);
    }
  }

  public interrupt() {
    this.stopPlayback();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text: '[User interrupted model]' }));
    }
    this.onStatusChange?.('listening');
  }

  private stopPlayback() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (_) {}
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
    this.isSpeaking = false;
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public stop() {
    this.stopPlayback();

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx) {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.isSpeaking = false;
    this.onStatusChange?.('idle');
  }
}

export const liveVoiceService = new LiveVoiceService();
