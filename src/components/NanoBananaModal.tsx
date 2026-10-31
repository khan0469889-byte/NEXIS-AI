import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Download,
  Image as ImageIcon,
  Send,
  Wand2,
  Maximize2,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { generateNanoBananaImage } from '../services/geminiService';

interface NanoBananaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (imageUrl: string, prompt: string) => void;
}

export const NanoBananaModal: React.FC<NanoBananaModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [model, setModel] = useState<'gemini-3.1-flash-lite-image' | 'gemini-nano-banana-2.1'>('gemini-3.1-flash-lite-image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const PRESETS = [
    { label: 'Cyberpunk Metropolis', text: 'A cyberpunk mega-city in 2099 with glowing neon holographic billboards in heavy rain, cinematic lighting, 8k render, Unreal Engine 5' },
    { label: 'Hyper-Realistic Portrait', text: 'Ultra-detailed studio portrait of a futuristic robotic cyborg with glowing sapphire optical sensors, cinematic volumetric lighting, 8k, photorealistic' },
    { label: 'Quantum Supercomputer', text: 'Close-up architectural view of a golden quantum dilution refrigerator surrounded by fiber optic waveguides and cryogenic mist' },
    { label: 'Solarpunk Sanctuary', text: 'A lush solarpunk vertical garden skyscraper with glass geodesic domes, cascading waterfalls, and solar drones at sunrise' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const result = await generateNanoBananaImage({
        prompt: prompt.trim(),
        aspectRatio,
        model,
      });

      setGeneratedImage(result.imageUrl);
    } catch (err: any) {
      console.error('Image gen error:', err);
      setErrorMsg(err.message || 'Failed to generate image. Please try a different prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `nano-banana-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSendToChat = () => {
    if (!generatedImage) return;
    onInsertToChat(generatedImage, prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-950/95 shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black text-xl shadow-lg shadow-amber-500/20">
              🍌
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                  NANO BANANA STUDIO
                </h3>
                <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                  HIGH-RES IMAGE ENGINE
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Powered by Gemini Nano Banana image synthesis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
              <span>Picture Prompt</span>
              <span className="text-[11px] text-neutral-500">Describe what you want to visualize</span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A hyper-realistic cyberpunk samurai meditating in a high-tech dojo, volumetric neon smoke, 8k..."
                rows={3}
                className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/90 p-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50 leading-relaxed"
              />
            </div>
          </div>

          {/* Quick Style Chips */}
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Quick Prompt Presets</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p.text)}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs text-neutral-300 hover:border-amber-500/50 hover:text-amber-200 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Model Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nano Banana Model Tier
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 px-3 text-xs text-neutral-200 focus:border-amber-500/60 focus:outline-none cursor-pointer"
              >
                <option value="gemini-3.1-flash-lite-image">⚡ Nano Banana Lite (Fast Generation)</option>
                <option value="gemini-nano-banana-2.1">🍌 Nano Banana 2.1 (Ultra High-Detail)</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all cursor-pointer shadow-lg ${
              prompt.trim() && !isGenerating
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:from-amber-400 hover:to-yellow-500 shadow-amber-500/25'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-black" />
                <span>Synthesizing Picture with Nano Banana...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>Generate Picture with Nano Banana</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Generated Image Result Display */}
          {generatedImage && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-semibold text-white">Generated Output</span>
                <span className="font-mono text-amber-400">{aspectRatio}</span>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[380px]">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="w-full h-auto max-h-[380px] object-contain rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Image</span>
                </button>

                <button
                  onClick={handleSendToChat}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black px-4 py-2 text-xs font-bold hover:from-amber-400 hover:to-yellow-500 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Insert into Chat Thread</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
