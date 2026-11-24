// src/components/AuditGuideModal.tsx
import React, { useState } from 'react';
import { X, ShieldCheck, Cpu, Smartphone, Wifi, Bluetooth, DollarSign, AlertCircle, Copy, Check } from 'lucide-react';

interface AuditGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
}

export const AuditGuideModal: React.FC<AuditGuideModalProps> = ({
  isOpen,
  onClose,
  highContrast,
}) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'FEASIBILITY' | 'PAIRING' | 'ANDROID' | 'BATTERY'>('AUDIT');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const capacitorJson = `{
  "appId": "org.caredose.app",
  "appName": "CareDose",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "LocalNotifications": {
      "smallIcon": "ic_stat_caredose",
      "iconColor": "#0f766e",
      "sound": "beep.wav"
    }
  }
}`;

  const manifestXml = `<!-- Zero-Cost Local Alarms & Device Wakeup -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.VIBRATE"/>

<!-- Nearby Direct Communication: Bluetooth LE -->
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                 android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

<!-- Same Wi-Fi LAN Communication -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5"
    >
      <div
        className={`w-full max-w-3xl rounded-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border ${
          highContrast
            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <div>
              <h2 className="font-black text-base">Zero-Mandatory-Cost Architecture & Android Native Specs</h2>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                Complete engineering documentation, cost transparency, and native deployment guide
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 dark:border-neutral-800 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'AUDIT'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cost Audit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FEASIBILITY')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'FEASIBILITY'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Platform Feasibility
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PAIRING')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'PAIRING'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pairing Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANDROID')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'ANDROID'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Capacitor & Manifest
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BATTERY')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'BATTERY'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Doze & Battery Rules
          </button>
        </div>

        {/* Modal Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {/* TAB 1: COST AUDIT */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-neutral-900 border border-teal-200 dark:border-yellow-300">
                <span className="font-bold text-teal-900 dark:text-yellow-200 block text-sm">
                  100% Zero-Mandatory-Cost Guarantee
                </span>
                <p className="text-teal-800 dark:text-yellow-100 mt-1">
                  CareDose requires no monthly SaaS subscription, no paid Twilio SMS gateway, and no mandatory cloud database. Everything runs on client-side compute, Bluetooth LE, and local home Wi-Fi.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 dark:border-neutral-800 text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-neutral-900 font-bold">
                      <th className="p-2.5 border">Component</th>
                      <th className="p-2.5 border">Role</th>
                      <th className="p-2.5 border">Mandatory?</th>
                      <th className="p-2.5 border">Limits & Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 border font-bold">IndexedDB / SQLite</td>
                      <td className="p-2.5 border">Stores meds, photos, logs</td>
                      <td className="p-2.5 border text-emerald-600 font-bold">Yes (Core)</td>
                      <td className="p-2.5 border">Unlimited offline. Zero cost forever.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-bold">AlarmManager / Timers</td>
                      <td className="p-2.5 border">Exact dose reminders</td>
                      <td className="p-2.5 border text-emerald-600 font-bold">Yes (Core)</td>
                      <td className="p-2.5 border">OS system calls. Zero cost.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-bold">Web Speech API / Native TTS</td>
                      <td className="p-2.5 border">Speaks reminders aloud</td>
                      <td className="p-2.5 border text-emerald-600 font-bold">Yes (Core)</td>
                      <td className="p-2.5 border">On-device synthesis. Zero cost.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-bold">Bluetooth LE (GATT)</td>
                      <td className="p-2.5 border">Nearby guardian alerts</td>
                      <td className="p-2.5 border text-emerald-600 font-bold">Yes (Nearby)</td>
                      <td className="p-2.5 border">Physical range 10-30m. Zero cost.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-bold">WebRTC LAN DataChannel</td>
                      <td className="p-2.5 border">Same-Wi-Fi router alerts</td>
                      <td className="p-2.5 border text-emerald-600 font-bold">Yes (Nearby)</td>
                      <td className="p-2.5 border">Works offline without ISP broadband. Zero cost.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-bold">Firebase Cloud Messaging</td>
                      <td className="p-2.5 border">Remote push when away</td>
                      <td className="p-2.5 border text-amber-600 font-bold">Optional (Disabled)</td>
                      <td className="p-2.5 border">Spark Free Plan: Generous free quota. If quota ends, nearby alerts remain active.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PLATFORM FEASIBILITY */}
          {activeTab === 'FEASIBILITY' && (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-yellow-200">
                CareDose provides a dual-engine architecture:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 dark:border-neutral-800 text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-neutral-900 font-bold">
                      <th className="p-2 border">Feature</th>
                      <th className="p-2 border">Browser PWA</th>
                      <th className="p-2 border">Capacitor Android Native</th>
                      <th className="p-2 border">CareDose Adapter</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border font-bold">Reminders</td>
                      <td className="p-2 border">Web Notifications + Web Worker interval timers</td>
                      <td className="p-2 border">@capacitor/local-notifications with AlarmManager</td>
                      <td className="p-2 border">Dual-Engine Notification Adapter with fallback</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold">Bluetooth LE</td>
                      <td className="p-2 border">Web Bluetooth API Central mode (user gesture required)</td>
                      <td className="p-2 border">@capacitor-community/bluetooth-le background GATT</td>
                      <td className="p-2 border">P2P Bluetooth Adapter with background check</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold">Wi-Fi LAN</td>
                      <td className="p-2 border">WebRTC DataChannel with QR exchanged SDP</td>
                      <td className="p-2 border">Embedded local HTTP listener + WebRTC</td>
                      <td className="p-2 border">Direct P2P LAN Protocol</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold">Text-to-Speech</td>
                      <td className="p-2 border">window.speechSynthesis (offline)</td>
                      <td className="p-2 border">Android TextToSpeech engine</td>
                      <td className="p-2 border">Zero-Cost Offline Speech Engine</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-bold">Persistence</td>
                      <td className="p-2 border">IndexedDB client database</td>
                      <td className="p-2 border">SQLite / IndexedDB</td>
                      <td className="p-2 border">Encrypted IndexedDB with image blobs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAIRING GUIDE */}
          {activeTab === 'PAIRING' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-neutral-900 border rounded-lg">
                <h4 className="font-bold text-sm text-slate-900 dark:text-yellow-100 mb-1">
                  Bluetooth LE Pairing Setup
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-700 dark:text-yellow-200">
                  <li>Open CareDose on both devices. Set one to <strong>Patient Mode</strong> and the other to <strong>Guardian Mode</strong>.</li>
                  <li>On the Patient device, open the <strong>Guardians</strong> tab and tap <strong>Pair Guardian</strong>.</li>
                  <li>A pairing QR code containing the ephemeral ECDH P-256 public key appears.</li>
                  <li>Scan the QR code using the Guardian device.</li>
                  <li>Both devices display a matching <strong>6-digit cryptographic verification code</strong>.</li>
                  <li>Once accepted on both sides, the derived AES-GCM shared key is saved locally in IndexedDB. Subsequent alerts are encrypted peer-to-peer.</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-neutral-900 border rounded-lg">
                <h4 className="font-bold text-sm text-slate-900 dark:text-yellow-100 mb-1">
                  Same-Wi-Fi (LAN) Communication Setup
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-700 dark:text-yellow-200">
                  <li>Verify both devices are connected to the same local Wi-Fi router.</li>
                  <li>Ensure <strong>Client Isolation / AP Isolation</strong> is turned <strong>OFF</strong> in router settings.</li>
                  <li>CareDose initializes a WebRTC DataChannel using initial pairing credentials. Alerts are routed over local IP addresses without accessing external cloud servers.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: CAPACITOR & MANIFEST */}
          {activeTab === 'ANDROID' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 dark:text-yellow-200">capacitor.config.json</span>
                  <button
                    type="button"
                    onClick={() => copyCode(capacitorJson, 'cap')}
                    className="flex items-center gap-1 text-[11px] text-teal-700 font-bold hover:underline"
                  >
                    {copiedKey === 'cap' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'cap' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto">
                  {capacitorJson}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 dark:text-yellow-200">
                    android/app/src/main/AndroidManifest.xml (Required Permissions)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(manifestXml, 'manifest')}
                    className="flex items-center gap-1 text-[11px] text-teal-700 font-bold hover:underline"
                  >
                    {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'manifest' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto">
                  {manifestXml}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: DOZE & BATTERY */}
          {activeTab === 'BATTERY' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-neutral-900 border border-amber-300 dark:border-yellow-300 rounded-lg text-amber-950 dark:text-yellow-200">
                <span className="font-bold block text-sm">Critical Android Battery Whitelisting Instructions</span>
                <p className="mt-1">
                  Certain Android OEM skins (e.g., Xiaomi MIUI/HyperOS, Samsung OneUI, Oppo ColorOS, Huawei EMUI) aggressively terminate background processes.
                </p>
                <div className="mt-2 font-semibold">
                  To ensure 100% reliable alarms on Android:
                </div>
                <ol className="list-decimal pl-4 mt-1 space-y-1">
                  <li>Open phone <strong>Settings</strong> &gt; <strong>Apps</strong> &gt; <strong>CareDose</strong>.</li>
                  <li>Tap <strong>Battery</strong> &gt; Select <strong>"Unrestricted"</strong> or <strong>"Don't optimize"</strong>.</li>
                  <li>Enable <strong>"Autostart"</strong> (on MIUI/ColorOS devices).</li>
                  <li>Enable <strong>"Alarms &amp; Reminders"</strong> permission under Special App Access.</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-neutral-900 border rounded-lg text-slate-700 dark:text-yellow-200">
                <span className="font-bold block text-sm text-slate-900 dark:text-yellow-100">
                  Medical &amp; Life Safety Disclosure
                </span>
                <p className="mt-1 leading-relaxed">
                  CareDose is a non-clinical wellness medication reminder application. It is designed to assist independent seniors and their caregivers through peer-to-peer coordination. It does not replace medical supervision, emergency response services (911/112), or certified hospital-grade telemetry.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
