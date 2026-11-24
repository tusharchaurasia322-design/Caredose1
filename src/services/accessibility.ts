// src/services/accessibility.ts
import { SupportedLanguage, I18nService } from './i18n';

export type FontSizeOption = 'NORMAL' | 'LARGE' | 'EXTRA_LARGE';

export type FloatingPositionPreset = 'BOTTOM_RIGHT' | 'BOTTOM_LEFT' | 'TOP_RIGHT' | 'TOP_LEFT';

export interface AccessibilitySettings {
  language: SupportedLanguage;
  fontSize: FontSizeOption;
  highContrast: boolean;
  simplifiedMode: boolean;
  largeButtonMode: boolean; // 64-80dp height for YES/NO and critical targets
  ttsEnabled: boolean;
  ttsRate: number; // 0.75 to 1.0
  vibrationEnabled: boolean;
  visualFlashingAlert: boolean; // Visual beacon for deaf/hard of hearing
  confirmationSafeguard: boolean; // Tremor prevention double-tap confirm
  voiceCommandsEnabled: boolean; // Hands-free voice recognition ("CareDose, I took my medicine")
  floatingBtnPosition: { x: number; y: number };
  selectedDisabilities: string[];
  onboardingCompleted: boolean;
}

const STORAGE_KEY = 'CAREDOS_ACCESSIBILITY_PREFS';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  language: 'en',
  fontSize: 'NORMAL',
  highContrast: false,
  simplifiedMode: false,
  largeButtonMode: false,
  ttsEnabled: true,
  ttsRate: 0.88,
  vibrationEnabled: true,
  visualFlashingAlert: true,
  confirmationSafeguard: false,
  voiceCommandsEnabled: true,
  floatingBtnPosition: { x: 20, y: 120 }, // Default bottom-right offset
  selectedDisabilities: [],
  onboardingCompleted: false
};

export class AccessibilityService {
  private static settings: AccessibilitySettings = DEFAULT_SETTINGS;
  private static listeners: Array<(settings: AccessibilitySettings) => void> = [];

  static init(): AccessibilitySettings {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.settings = { ...DEFAULT_SETTINGS, ...parsed };
        } else {
          // Check legacy keys
          const legacyHc = localStorage.getItem('CAREDOS_HIGH_CONTRAST') === 'true';
          const legacyLarge = localStorage.getItem('CAREDOS_LARGE_TEXT') === 'true';
          const legacyTts = localStorage.getItem('CAREDOS_TTS') !== 'false';
          const legacyLang = (localStorage.getItem('CAREDOS_LANGUAGE') as SupportedLanguage) || 'en';

          this.settings = {
            ...DEFAULT_SETTINGS,
            highContrast: legacyHc,
            fontSize: legacyLarge ? 'LARGE' : 'NORMAL',
            ttsEnabled: legacyTts,
            language: legacyLang
          };
        }
      } catch (e) {
        console.warn('Failed to parse accessibility settings from storage:', e);
        this.settings = { ...DEFAULT_SETTINGS };
      }
    }
    I18nService.setLanguage(this.settings.language);
    return this.settings;
  }

  static getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  static updateSettings(partial: Partial<AccessibilitySettings>) {
    this.settings = { ...this.settings, ...partial };

    if (partial.language) {
      I18nService.setLanguage(partial.language);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      // Sync legacy keys for backward compatibility
      localStorage.setItem('CAREDOS_HIGH_CONTRAST', String(this.settings.highContrast));
      localStorage.setItem('CAREDOS_LARGE_TEXT', String(this.settings.fontSize !== 'NORMAL'));
      localStorage.setItem('CAREDOS_TTS', String(this.settings.ttsEnabled));
      localStorage.setItem('CAREDOS_LANGUAGE', this.settings.language);
    }

    this.notify();
  }

  static resetDefaults() {
    this.settings = {
      ...DEFAULT_SETTINGS,
      language: this.settings.language, // keep language
      onboardingCompleted: true
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    }
    this.notify();
  }

  // Smart auto-recommendation algorithm based on user-selected disability needs
  static generateRecommendations(needs: string[]): Partial<AccessibilitySettings> {
    const recommended: Partial<AccessibilitySettings> = {};

    const hasHearing = needs.includes('hearing');
    const hasVisual = needs.includes('visual');
    const hasMotor = needs.includes('motor') || needs.includes('tremors');
    const hasReading = needs.includes('reading');
    const hasCognitive = needs.includes('cognitive');
    const hasSpeech = needs.includes('speech');

    // Visual impairment adjustments
    if (hasVisual) {
      recommended.highContrast = true;
      recommended.fontSize = 'EXTRA_LARGE';
      recommended.largeButtonMode = true;
      recommended.ttsEnabled = true;
      recommended.ttsRate = 0.85;
    }

    // Hearing impairment adjustments
    if (hasHearing) {
      recommended.vibrationEnabled = true;
      recommended.visualFlashingAlert = true;
      recommended.highContrast = true;
    }

    // Motor control / Tremors adjustments
    if (hasMotor) {
      recommended.largeButtonMode = true;
      recommended.confirmationSafeguard = true;
      recommended.simplifiedMode = true;
      recommended.fontSize = 'LARGE';
    }

    // Low literacy / cognitive adjustments
    if (hasReading || hasCognitive) {
      recommended.simplifiedMode = true;
      recommended.ttsEnabled = true;
      recommended.largeButtonMode = true;
      recommended.ttsRate = 0.8;
    }

    // Speech adjustments
    if (hasSpeech) {
      // Confirm without speech
    }

    return recommended;
  }

  static subscribe(listener: (settings: AccessibilitySettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    const current = { ...this.settings };
    this.listeners.forEach(l => {
      try {
        l(current);
      } catch (err) {
        console.error(err);
      }
    });
  }
}

// Initialize on load
AccessibilityService.init();
