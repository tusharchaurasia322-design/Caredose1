// src/components/GuardianModal.tsx
import React, { useState } from 'react';
import { GuardianProfile } from '../services/db';
import { AccessibilitySettings } from '../services/accessibility';
import { CryptoEngine } from '../services/crypto';
import { ShieldCheck, X, Phone, User, Radio, Sparkles } from 'lucide-react';

interface GuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGuardian: (guardian: GuardianProfile) => Promise<void>;
  settings: AccessibilitySettings;
  patientPublicKey?: string;
}

export const GuardianModal: React.FC<GuardianModalProps> = ({
  isOpen,
  onClose,
  onSaveGuardian,
  settings,
  patientPublicKey = '',
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Primary Caregiver');
  const [connectionType, setConnectionType] = useState<'BLUETOOTH' | 'WIFI_LAN' | 'REMOTE'>('BLUETOOTH');
  const [peerPublicKey, setPeerPublicKey] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const keyToUse = peerPublicKey.trim() || patientPublicKey || 'DEMO_ECDH_PUBKEY_' + Date.now();
      const code = await CryptoEngine.get6DigitVerificationCode(keyToUse);

      const newGuardian: GuardianProfile = {
        id: 'guardian_' + Date.now(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        relationship: relationship.trim() || 'Caregiver',
        pairingPublicKey: keyToUse,
        sharedSecret: 'DERIVED_AES256_' + code,
        connectionType,
        pairingStatus: 'PAIRED',
        pairedAt: Date.now()
      };

      await onSaveGuardian(newGuardian);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isExtraLarge = settings.fontSize === 'EXTRA_LARGE';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardian-modal-title"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-6 max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl border ${
          settings.highContrast
            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                settings.highContrast ? 'bg-yellow-300 text-black' : 'bg-teal-100 text-teal-800'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="guardian-modal-title" className={`font-black ${isExtraLarge ? 'text-2xl' : 'text-lg'}`}>
                Add Designated Guardian
              </h2>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                Setup caregiver pairing for zero-cost missed dose alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Guardian Name */}
          <div>
            <label className="block font-bold text-xs mb-1">
              Guardian Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Elena Silva, Priya Sharma, Raj Patel"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full rounded-xl border p-3 text-sm transition-colors ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300 placeholder-yellow-600'
                  : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-teal-600'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone Number */}
            <div>
              <label className="block font-bold text-xs mb-1">
                Phone Number (for direct calling)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`w-full rounded-xl border p-3 pl-9 text-sm ${
                    settings.highContrast
                      ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Relationship */}
            <div>
              <label className="block font-bold text-xs mb-1">
                Relationship
              </label>
              <input
                type="text"
                placeholder="e.g. Daughter, Son, Spouse, Caregiver"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                className={`w-full rounded-xl border p-3 text-sm ${
                  settings.highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                    : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Connection Channel */}
          <div>
            <label className="block font-bold text-xs mb-1">
              Connection Channel
            </label>
            <select
              value={connectionType}
              onChange={e => setConnectionType(e.target.value as any)}
              className={`w-full rounded-xl border p-3 text-sm ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-slate-50 border-slate-300'
              }`}
            >
              <option value="BLUETOOTH">Bluetooth Low Energy (Zero Cost BLE)</option>
              <option value="WIFI_LAN">Local Wi-Fi Router (Zero Cost WebRTC)</option>
              <option value="REMOTE">Optional Remote Push</option>
            </select>
          </div>

          {/* Peer Public Key (Optional) */}
          <div>
            <label className="block font-bold text-xs mb-1">
              Peer Public Key (Optional — leave blank to auto-pair)
            </label>
            <textarea
              rows={2}
              placeholder="Paste base64 ECDH public key from Guardian device (or leave blank to auto-link)"
              value={peerPublicKey}
              onChange={e => setPeerPublicKey(e.target.value)}
              className={`w-full rounded-xl border p-2.5 font-mono text-[11px] ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`p-3 rounded-xl border font-bold text-xs text-center transition-colors min-h-[44px] ${
                settings.highContrast
                  ? 'border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className={`p-3 rounded-xl font-black text-xs text-center shadow transition-transform active:scale-95 disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1.5 ${
                settings.highContrast
                  ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                  : 'bg-teal-700 text-white hover:bg-teal-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{saving ? 'Pairing...' : 'Save & Link Guardian'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
