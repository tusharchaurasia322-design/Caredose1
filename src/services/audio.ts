// src/services/audio.ts

class SoundSynthesizer {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Pleasant musical reminder chime: C5 -> E5 -> G5 -> C6
  playReminderChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.5);
    });
  }

  // Urgent missed dose / alert chime (two-tone attention alarm)
  playAlertChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const freqs = [880, 587.33, 880, 587.33];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.18);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + idx * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.18);
      osc.stop(ctx.currentTime + idx * 0.18 + 0.25);
    });
  }

  // Reassuring confirmation chime when dose is taken or "I am safe" is pressed
  playSuccessChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
    });
  }

  // Haptic vibration (if available on device)
  vibrate(pattern: number | number[] = [200, 100, 200]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignored if permissions not granted
      }
    }
  }
}

export const sound = new SoundSynthesizer();

export interface CaptionListener {
  (text: string, isSpeaking: boolean): void;
}

export class SpeechEngine {
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static currentCaption: string = '';
  private static isSpeaking: boolean = false;
  private static listeners: CaptionListener[] = [];

  static init() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      SpeechEngine.cachedVoices = window.speechSynthesis.getVoices();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  static subscribeCaptions(listener: CaptionListener): () => void {
    SpeechEngine.listeners.push(listener);
    // Emit immediate current state
    listener(SpeechEngine.currentCaption, SpeechEngine.isSpeaking);
    return () => {
      SpeechEngine.listeners = SpeechEngine.listeners.filter(l => l !== listener);
    };
  }

  private static notifyCaptions(text: string, speaking: boolean) {
    SpeechEngine.currentCaption = text;
    SpeechEngine.isSpeaking = speaking;
    SpeechEngine.listeners.forEach(l => {
      try { l(text, speaking); } catch (e) { console.error(e); }
    });
  }

  // Normalize medical text for clear, natural speech output
  static cleanTextForSpeech(text: string, langCode: string): string {
    let cleaned = text;

    // Expand common abbreviations for clear pronunciation
    cleaned = cleaned.replace(/(\d+)\s*mg\b/gi, '$1 milligrams');
    cleaned = cleaned.replace(/(\d+)\s*ml\b/gi, '$1 milliliters');
    cleaned = cleaned.replace(/\b1\s*tab\b/gi, '1 tablet');
    cleaned = cleaned.replace(/(\d+)\s*tabs\b/gi, '$1 tablets');

    if (langCode.startsWith('hi')) {
      // Clean Hindi abbreviations
      cleaned = cleaned.replace(/(\d+)\s*मिलीग्राम/g, '$1 मिलीग्राम');
      cleaned = cleaned.replace(/(\d+)\s*गोली/g, '$1 गोली');
    }

    // Remove punctuation marks that synthesizers pronounce awkwardly
    cleaned = cleaned.replace(/[·•|/*_~`]/g, ' ');
    cleaned = cleaned.replace(/[()\[\]{}]/g, ', ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  // Best voice selection prioritizing natural human-like voices
  private static getBestVoice(langPrefix: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    if (SpeechEngine.cachedVoices.length === 0) {
      SpeechEngine.cachedVoices = window.speechSynthesis.getVoices();
    }

    const voices = SpeechEngine.cachedVoices;
    if (voices.length === 0) return null;

    // Filter by target language prefix (e.g., 'hi' or 'en')
    const matchingLangVoices = voices.filter(v =>
      v.lang.toLowerCase().startsWith(langPrefix.toLowerCase())
    );

    if (matchingLangVoices.length === 0) {
      // Fallback to any voice
      return voices[0];
    }

    // Rank voices: Prefer Google / Natural / Enhanced voices over robotic compact synthesizers
    const qualityKeywords = ['google', 'natural', 'enhanced', 'premium', 'samantha', 'daniel', 'karen', 'lekha', 'hindi'];
    for (const kw of qualityKeywords) {
      const best = matchingLangVoices.find(v => v.name.toLowerCase().includes(kw));
      if (best) return best;
    }

    return matchingLangVoices[0];
  }

  static speak(
    text: string,
    enabled: boolean = true,
    langCode: string = 'en-US',
    rate: number = 0.82 // Measured, clear pace
  ) {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      SpeechEngine.notifyCaptions(text, false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const spokenText = SpeechEngine.cleanTextForSpeech(text, langCode);
      const utterance = new SpeechSynthesisUtterance(spokenText);

      utterance.rate = rate; // Slower cadence for crystal clarity
      utterance.pitch = 1.0;
      utterance.lang = langCode;

      const langPrefix = langCode.slice(0, 2);
      const voice = SpeechEngine.getBestVoice(langPrefix);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        SpeechEngine.notifyCaptions(text, true);
      };

      utterance.onend = () => {
        SpeechEngine.notifyCaptions('', false);
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        SpeechEngine.notifyCaptions('', false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
      SpeechEngine.notifyCaptions('', false);
    }
  }

  static stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    SpeechEngine.notifyCaptions('', false);
  }
}

// Initialize voices listener
SpeechEngine.init();
