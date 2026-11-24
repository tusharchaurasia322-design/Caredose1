// src/components/HelpTab.tsx
import React, { useState } from 'react';
import { PatientProfile } from '../services/db';
import { sound, SpeechEngine } from '../services/audio';
import {
  HelpCircle,
  Mail,
  Send,
  MessageSquare,
  Sparkles,
  Bug,
  Lightbulb,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

interface HelpTabProps {
  activePatient: PatientProfile | null;
  highContrast: boolean;
  largeText: boolean;
  ttsEnabled: boolean;
}

export const HelpTab: React.FC<HelpTabProps> = ({
  activePatient,
  highContrast,
  largeText,
  ttsEnabled,
}) => {
  const DEVELOPER_EMAIL = 'tusharchaurasia322@gmail.com';

  const [feedbackType, setFeedbackType] = useState<'BUG' | 'SUGGESTION' | 'QUESTION' | 'ACCESSIBILITY'>('BUG');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [contactName, setContactName] = useState(activePatient?.name || '');
  const [contactEmailOrPhone, setContactEmailOrPhone] = useState(activePatient?.phone || '');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const buildEmailBody = () => {
    const typeLabel =
      feedbackType === 'BUG'
        ? 'Problem / Bug Report'
        : feedbackType === 'SUGGESTION'
        ? 'Feature Suggestion'
        : feedbackType === 'ACCESSIBILITY'
        ? 'Accessibility Feedback'
        : 'General Question';

    let body = `Hello CareDose Team,\n\n`;
    body += `I would like to share the following ${typeLabel.toLowerCase()}:\n\n`;
    body += `Type: ${typeLabel}\n`;
    body += `From: ${contactName || 'CareDose User'}\n`;
    if (contactEmailOrPhone) {
      body += `Contact: ${contactEmailOrPhone}\n`;
    }
    body += `\n--- DESCRIPTION ---\n${details}\n\n`;

    if (includeDiagnostics) {
      body += `--- SYSTEM DIAGNOSTICS ---\n`;
      body += `App: CareDose Zero-Cost Offline Reminder\n`;
      body += `User-Agent: ${navigator.userAgent}\n`;
      body += `Language: ${navigator.language}\n`;
      body += `High Contrast: ${highContrast ? 'Enabled' : 'Disabled'}\n`;
      body += `TTS Voice: ${ttsEnabled ? 'Enabled' : 'Disabled'}\n`;
      body += `Timestamp: ${new Date().toISOString()}\n`;
    }

    return body;
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    const typePrefix =
      feedbackType === 'BUG'
        ? '[CareDose Problem]'
        : feedbackType === 'SUGGESTION'
        ? '[CareDose Suggestion]'
        : feedbackType === 'ACCESSIBILITY'
        ? '[CareDose Accessibility]'
        : '[CareDose Question]';

    const emailSubject = encodeURIComponent(`${typePrefix} ${subject.trim() || 'User Feedback'}`);
    const emailBody = encodeURIComponent(buildEmailBody());

    const mailtoUrl = `mailto:${DEVELOPER_EMAIL}?subject=${emailSubject}&body=${emailBody}`;
    window.location.href = mailtoUrl;

    sound.playSuccessChime();
    SpeechEngine.speak('Opening email to send your feedback.', ttsEnabled);
    setSubmittedStatus(true);
  };

  const handleOpenGmailWeb = () => {
    if (!details.trim()) return;
    const typePrefix =
      feedbackType === 'BUG'
        ? '[CareDose Problem]'
        : feedbackType === 'SUGGESTION'
        ? '[CareDose Suggestion]'
        : feedbackType === 'ACCESSIBILITY'
        ? '[CareDose Accessibility]'
        : '[CareDose Question]';

    const emailSubject = encodeURIComponent(`${typePrefix} ${subject.trim() || 'User Feedback'}`);
    const emailBody = encodeURIComponent(buildEmailBody());
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${DEVELOPER_EMAIL}&su=${emailSubject}&body=${emailBody}`;
    window.open(gmailUrl, '_blank');
    sound.playSuccessChime();
    setSubmittedStatus(true);
  };

  const handleCopyDraft = () => {
    const draftText = `To: ${DEVELOPER_EMAIL}\nSubject: [CareDose Feedback] ${subject || 'Feedback'}\n\n${buildEmailBody()}`;
    navigator.clipboard.writeText(draftText);
    setCopiedDraft(true);
    sound.playSuccessChime();
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  const faqs = [
    {
      q: 'How does CareDose work completely offline without monthly charges?',
      a: 'CareDose stores all patient data, medication schedules, and dose confirmations directly inside your browser’s IndexedDB. Alert communication uses local Bluetooth Low Energy (BLE) and Wi-Fi router WebRTC, eliminating paid SMS or cloud database servers.'
    },
    {
      q: 'How do I pair a guardian device?',
      a: 'In the Guardian Hub, tap "Cryptographic Guardian Pairing QR Code" to show the patient’s ECDH P-256 QR code. On the guardian’s device, scan the QR code and verify the 6-digit cryptographic security code.'
    },
    {
      q: 'How does the hands-free voice command work?',
      a: 'When an alarm sounds or a dose is pending, simply say "CareDose, I took my medicine". The built-in Web Speech API recognizes your voice, plays a confirmation chime, logs the dose, and deducts 1 tablet from your remaining stock.'
    },
    {
      q: 'How is the medication Refill Due date calculated?',
      a: 'CareDose divides your current remaining tablet stock by your scheduled daily doses (consumption rate). If you have 20 tablets and take 2 per day, your estimated Refill Due date is in 10 days.'
    },
    {
      q: 'Can I customize the reminder alert time before my dose?',
      a: 'Yes! When adding or editing a medicine, you can set a custom reminder lead time from 1 minute up to 30 minutes (30 minutes is the suggested maximum limit).'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`font-black ${largeText ? 'text-2xl' : 'text-xl'}`}>Help, Support & Suggestions</h2>
          <p className="text-xs text-slate-500 dark:text-yellow-200">
            Report problems, suggest improvements, or ask questions directly
          </p>
        </div>
        <div className={`p-2.5 rounded-2xl ${highContrast ? 'bg-yellow-300 text-black' : 'bg-teal-100 text-teal-800'}`}>
          <HelpCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Developer Destination Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
          highContrast
            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
            : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 text-teal-950'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-teal-700 text-white shrink-0 shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
              Direct Support Email
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm break-all text-teal-900 dark:text-yellow-200">
              {DEVELOPER_EMAIL}
            </span>
          </div>
        </div>

        <a
          href={`mailto:${DEVELOPER_EMAIL}`}
          className={`shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-transform active:scale-95 ${
            highContrast
              ? 'bg-yellow-300 text-black hover:bg-yellow-200'
              : 'bg-teal-700 text-white hover:bg-teal-800 shadow-xs'
          }`}
        >
          <span>Send Direct</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Submission Success Banner */}
      {submittedStatus && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 dark:bg-neutral-900 dark:border-yellow-300 dark:text-yellow-300 flex items-start justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-yellow-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-xs">Email Client Dispatched!</p>
              <p className="text-[11px] mt-0.5 leading-snug">
                Your feedback was formatted and opened in your email composer addressed to <strong>{DEVELOPER_EMAIL}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedStatus(false)}
            className="text-xs font-black p-1 hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Feedback Form Card */}
      <section
        className={`p-5 rounded-2xl border transition-all ${
          highContrast
            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-neutral-800">
          <MessageSquare className="w-4 h-4 text-teal-600 dark:text-yellow-300" />
          <h3 className="font-black text-sm">Define Problem or Suggestion</h3>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
          {/* Feedback Type Selector */}
          <div>
            <label className="block font-bold text-xs mb-2">What kind of feedback are you submitting?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFeedbackType('BUG')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-center transition-all ${
                  feedbackType === 'BUG'
                    ? highContrast
                      ? 'bg-yellow-300 text-black border-yellow-300 font-black'
                      : 'bg-rose-50 border-2 border-rose-500 text-rose-900 shadow-xs'
                    : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Bug className="w-4 h-4 text-rose-600" />
                <span>Problem / Bug</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('SUGGESTION')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-center transition-all ${
                  feedbackType === 'SUGGESTION'
                    ? highContrast
                      ? 'bg-yellow-300 text-black border-yellow-300 font-black'
                      : 'bg-teal-50 border-2 border-teal-600 text-teal-950 shadow-xs'
                    : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Suggestion</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('ACCESSIBILITY')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-center transition-all ${
                  feedbackType === 'ACCESSIBILITY'
                    ? highContrast
                      ? 'bg-yellow-300 text-black border-yellow-300 font-black'
                      : 'bg-blue-50 border-2 border-blue-600 text-blue-950 shadow-xs'
                    : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Accessibility</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('QUESTION')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-center transition-all ${
                  feedbackType === 'QUESTION'
                    ? highContrast
                      ? 'bg-yellow-300 text-black border-yellow-300 font-black'
                      : 'bg-purple-50 border-2 border-purple-600 text-purple-950 shadow-xs'
                    : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>Question</span>
              </button>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-xs mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel, Maria Silva"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className={`w-full rounded-xl border p-2.5 text-xs ${
                  highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                    : 'bg-slate-50 border-slate-300 focus:bg-white'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-xs mb-1">Your Email or Phone (for replies)</label>
              <input
                type="text"
                placeholder="e.g. user@example.com or +91 9876543210"
                value={contactEmailOrPhone}
                onChange={e => setContactEmailOrPhone(e.target.value)}
                className={`w-full rounded-xl border p-2.5 text-xs ${
                  highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                    : 'bg-slate-50 border-slate-300 focus:bg-white'
                }`}
              />
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block font-bold text-xs mb-1">Subject / Summary</label>
            <input
              type="text"
              placeholder={
                feedbackType === 'BUG'
                  ? 'e.g. Tablet count did not update on confirmation'
                  : feedbackType === 'SUGGESTION'
                  ? 'e.g. Add weekly calendar view for upcoming doses'
                  : 'Brief summary of your question or feedback'
              }
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className={`w-full rounded-xl border p-2.5 text-xs ${
                highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-slate-50 border-slate-300 focus:bg-white'
              }`}
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block font-bold text-xs mb-1">
              Problem Description / Suggestion Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder={
                feedbackType === 'BUG'
                  ? 'Please describe what went wrong, steps to reproduce, and what you expected to happen...'
                  : feedbackType === 'SUGGESTION'
                  ? 'Please describe the feature you would like to see and how it helps you or your patient...'
                  : 'Describe your question or difficulty in detail...'
              }
              value={details}
              onChange={e => setDetails(e.target.value)}
              className={`w-full rounded-xl border p-3 text-xs ${
                highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-slate-50 border-slate-300 focus:bg-white'
              }`}
            />
          </div>

          {/* Include Diagnostics Toggle */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={includeDiagnostics}
              onChange={e => setIncludeDiagnostics(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-[11px] text-slate-600 dark:text-yellow-200">
              Include anonymous app diagnostic settings (browser, screen contrast, voice setting)
            </span>
          </label>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="submit"
              disabled={!details.trim()}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow transition-transform active:scale-95 disabled:opacity-50 min-h-[44px] ${
                highContrast
                  ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                  : 'bg-teal-700 text-white hover:bg-teal-800'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Send Email to {DEVELOPER_EMAIL}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenGmailWeb}
              disabled={!details.trim()}
              className={`py-3 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 min-h-[44px] ${
                highContrast
                  ? 'border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Open draft directly in Gmail on the web"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Gmail</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDraft}
              disabled={!details.trim()}
              className={`py-3 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 min-h-[44px] ${
                highContrast
                  ? 'border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {copiedDraft ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDraft ? 'Copied!' : 'Copy Draft'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <section
        className={`p-5 rounded-2xl border transition-all ${
          highContrast
            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-neutral-800">
          <Info className="w-4 h-4 text-teal-600 dark:text-yellow-300" />
          <h3 className="font-black text-sm">Frequently Asked Questions & User Guide</h3>
        </div>

        <div className="space-y-2 text-xs">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-3 text-left font-bold flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-slate-800 dark:text-yellow-100">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-3 pt-0 text-slate-600 dark:text-yellow-200/90 text-[11px] leading-relaxed border-t border-slate-100 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
