// src/services/voiceListener.ts
/**
 * Voice Command Listener for CareDose
 * Allows patients (especially elderly, those with tremors, or impaired mobility)
 * to confirm dose ingestion hands-free by saying:
 * "CareDose, I took my medicine"
 */

// Typing for Web Speech API SpeechRecognition
interface SpeechRecognitionEventLike extends Event {
  results: {
    length: number;
    item(index: number): {
      isFinal: boolean;
      length: number;
      item(index: number): { transcript: string; confidence: number };
      [index: number]: { transcript: string; confidence: number };
    };
    [index: number]: {
      isFinal: boolean;
      length: number;
      item(index: number): { transcript: string; confidence: number };
      [index: number]: { transcript: string; confidence: number };
    };
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type VoiceListenerStatus =
  | 'idle'
  | 'listening'
  | 'hearing'
  | 'matched'
  | 'paused'
  | 'unsupported'
  | 'permission_denied'
  | 'error';

export interface VoiceMatchResult {
  phrase: string;
  confidence: number;
  rawTranscript: string;
}

export interface VoiceListenerOptions {
  language?: string;
  continuous?: boolean;
  autoRestart?: boolean;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onMatch?: (result: VoiceMatchResult) => void;
  onStatusChange?: (status: VoiceListenerStatus, errorMsg?: string) => void;
}

export class VoiceCommandService {
  private static recognition: SpeechRecognitionInstance | null = null;
  private static isListening: boolean = false;
  private static shouldBeListening: boolean = false;
  private static activeOptions: VoiceListenerOptions | null = null;
  private static restartTimeout: any = null;
  private static currentStatus: VoiceListenerStatus = 'idle';
  private static currentTranscript: string = '';

  /**
   * Check if the browser supports Speech Recognition
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Normalize text for robust phrase matching
   */
  static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Robust matching for "CareDose, I took my medicine" and natural variations
   */
  static matchConfirmationPhrase(rawText: string): boolean {
    if (!rawText) return false;
    const clean = this.normalizeText(rawText);

    // Primary exact phrase:
    if (
      clean.includes('caredose i took my medicine') ||
      clean.includes('care dose i took my medicine') ||
      clean.includes('karedose i took my medicine') ||
      clean.includes('care-dose i took my medicine')
    ) {
      return true;
    }

    // Wake word variations:
    const hasWakeWord =
      clean.includes('caredose') ||
      clean.includes('care dose') ||
      clean.includes('karedose') ||
      clean.includes('care dos') ||
      clean.includes('care doc') ||
      clean.includes('केयरडोज़') ||
      clean.includes('केयर डोज');

    // Medicine taken action variations:
    const hasTakenAction =
      clean.includes('took my medicine') ||
      clean.includes('took the medicine') ||
      clean.includes('took medicine') ||
      clean.includes('taken my medicine') ||
      clean.includes('taken the medicine') ||
      clean.includes('have taken my medicine') ||
      clean.includes('took my dose') ||
      clean.includes('took the dose') ||
      clean.includes('took my pills') ||
      clean.includes('took the pills') ||
      clean.includes('took my tablet') ||
      clean.includes('took my tablets') ||
      clean.includes('took the tablet') ||
      clean.includes('took it') ||
      clean.includes('i took it') ||
      // Hindi translations & variations
      clean.includes('मैंने दवाई ले ली') ||
      clean.includes('मैंने दवा ले ली') ||
      clean.includes('दवाई ले ली') ||
      clean.includes('दवा ले ली') ||
      clean.includes('दवाई खा ली') ||
      clean.includes('दवा खा ली') ||
      clean.includes('maine dawai le li') ||
      clean.includes('dawai le li');

    if (hasWakeWord && hasTakenAction) {
      return true;
    }

    // Also accept direct clear affirmation if spoken directly during modal prompt
    if (
      clean.includes('i took my medicine') ||
      clean.includes('i took the medicine') ||
      clean.includes('i have taken my medicine') ||
      clean.includes('मैंने दवाई ले ली है')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Start listening for voice commands
   */
  static startListening(options: VoiceListenerOptions): () => void {
    this.stopListening();
    this.activeOptions = options;
    this.shouldBeListening = true;

    if (!this.isSupported()) {
      this.setStatus('unsupported', 'Speech recognition is not supported in this browser.');
      return () => this.stopListening();
    }

    const SpeechRecClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecClass) {
      this.setStatus('unsupported');
      return () => this.stopListening();
    }

    try {
      const recognition = new SpeechRecClass();
      this.recognition = recognition;

      recognition.continuous = options.continuous !== false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      // Select language
      const langCode = options.language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.lang = langCode;

      recognition.onstart = () => {
        this.isListening = true;
        this.setStatus('listening');
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let fullTranscript = '';
        let latestAlternative = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';
          fullTranscript += transcript + ' ';
          if (res.isFinal) {
            latestAlternative = transcript;
          }
        }

        const candidateText = (fullTranscript + ' ' + latestAlternative).trim();
        this.currentTranscript = candidateText;
        this.setStatus('hearing');

        if (this.activeOptions?.onTranscript) {
          this.activeOptions.onTranscript(candidateText, false);
        }

        // Check if matched
        if (this.matchConfirmationPhrase(candidateText)) {
          this.setStatus('matched');
          if (this.activeOptions?.onTranscript) {
            this.activeOptions.onTranscript(candidateText, true);
          }
          if (this.activeOptions?.onMatch) {
            this.activeOptions.onMatch({
              phrase: 'CareDose, I took my medicine',
              confidence: 0.95,
              rawTranscript: candidateText
            });
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn('VoiceCommandService recognition error:', event.error, event.message);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.shouldBeListening = false;
          this.setStatus('permission_denied', 'Microphone permission was denied.');
        } else if (event.error === 'no-speech') {
          // Normal timeout when patient is silent, status goes back to listening
          this.setStatus('listening');
        } else if (event.error === 'aborted') {
          // Normal user abort
        } else {
          this.setStatus('error', `Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        // If still active, automatically restart so user can say phrase whenever ready
        if (this.shouldBeListening && options.autoRestart !== false) {
          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.shouldBeListening && this.recognition) {
              try {
                this.recognition.start();
              } catch (e) {
                // If restarting too fast, retry after 500ms
                setTimeout(() => {
                  if (this.shouldBeListening && this.recognition) {
                    try { this.recognition.start(); } catch {}
                  }
                }, 500);
              }
            }
          }, 250);
        } else {
          this.setStatus('idle');
        }
      };

      recognition.start();
    } catch (e) {
      console.warn('Failed to start SpeechRecognition:', e);
      this.setStatus('error', String(e));
    }

    return () => this.stopListening();
  }

  /**
   * Stop active listening session
   */
  static stopListening() {
    this.shouldBeListening = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    this.isListening = false;
    this.setStatus('idle');
  }

  /**
   * Simulate speaking the confirmation phrase.
   * Crucial for automated verification, noisy environments, or devices with restricted mic permissions.
   */
  static simulatePhrase(phrase: string = 'CareDose, I took my medicine') {
    this.currentTranscript = phrase;
    this.setStatus('matched');

    if (this.activeOptions?.onTranscript) {
      this.activeOptions.onTranscript(phrase, true);
    }

    if (this.activeOptions?.onMatch) {
      this.activeOptions.onMatch({
        phrase: 'CareDose, I took my medicine',
        confidence: 1.0,
        rawTranscript: phrase
      });
    }
  }

  private static setStatus(status: VoiceListenerStatus, errorMsg?: string) {
    this.currentStatus = status;
    if (this.activeOptions?.onStatusChange) {
      this.activeOptions.onStatusChange(status, errorMsg);
    }
  }

  static getStatus(): VoiceListenerStatus {
    return this.currentStatus;
  }

  static getTranscript(): string {
    return this.currentTranscript;
  }
}
