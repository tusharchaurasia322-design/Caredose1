// src/services/db.ts

export interface PatientProfile {
  id: string;
  name: string;
  dob?: string;
  phone?: string;
  preferredLanguage: string;
  highContrast: boolean;
  largeFont: boolean;
  screenReaderVoice: boolean;
  vibrationAlert: boolean;
  lastQualifyingCheckIn: number; // Unix timestamp in ms
  createdAt: number;
}

export interface GuardianProfile {
  id: string;
  name: string;
  phone?: string;
  relationship: string;
  pairingPublicKey: string; // Hex-encoded or base64 ECDH public key
  sharedSecret?: string;    // Derived AES-GCM key or fingerprint
  connectionType: 'BLUETOOTH' | 'WIFI_LAN' | 'REMOTE' | 'NONE';
  pairingStatus: 'UNPAIRED' | 'PENDING' | 'PAIRED' | 'REVOKED';
  pairedAt?: number;
}

export interface Medicine {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  instructions: string; // e.g., "Take after meal with water"
  scheduledTimes: string[]; // ["08:00", "13:00", "20:00"]
  startDate: string;
  endDate?: string;
  photoBlobUri?: string; // Stored as Base64 / data URL
  pillColor?: string;
  pillShape?: string;
  isActive: boolean;
  remind30MinBefore: boolean;
  remind5MinBefore: boolean;
  reminderMinutesBefore?: number; // Custom reminder time in minutes (1 to 30 min, default: 30 suggested)
  alertAfter5MinMissed: boolean;
  totalStock?: number;        // Total tablets/units currently available (e.g. 20)
  lowStockThreshold?: number; // Alert when stock reaches or falls below this (e.g. 5)
  unitType?: string;          // 'tablets' | 'capsules' | 'pills' | 'ml' (default: 'tablets')
}

export interface DoseEvent {
  id: string;
  medicineId: string;
  patientId: string;
  scheduledTime: number; // Exact timestamp
  status: 'PENDING' | 'CONFIRMED_YES' | 'CONFIRMED_NO' | 'MISSED';
  confirmedAt?: number;
  alertStatus: 'NOT_APPLICABLE' | 'LOCAL_ONLY' | 'QUEUED' | 'DELIVERED' | 'ACKNOWLEDGED';
  acknowledgedByGuardianId?: string;
  acknowledgedAt?: number;
  deliveryAttemptCount: number;
  lastAttemptLog?: string;
}

export interface AlertLogItem {
  id: string;
  doseEventId?: string;
  patientId: string;
  type: 'MISSED_DOSE' | 'DOSE_DECLINED' | 'SILENCE_48H_ESCALATION' | 'SYSTEM_TEST';
  timestamp: number;
  status: 'QUEUED' | 'SENDING' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';
  channelUsed: 'BLUETOOTH' | 'WIFI_LAN' | 'REMOTE_PUSH' | 'LOCAL_FALLBACK';
  details: string;
}

const DB_NAME = 'CareDose_DB';
const DB_VERSION = 1;

export class CareDoseDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('guardians')) {
          db.createObjectStore('guardians', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('medicines')) {
          const medStore = db.createObjectStore('medicines', { keyPath: 'id' });
          medStore.createIndex('patientId', 'patientId', { unique: false });
        }
        if (!db.objectStoreNames.contains('doses')) {
          const doseStore = db.createObjectStore('doses', { keyPath: 'id' });
          doseStore.createIndex('patientId', 'patientId', { unique: false });
          doseStore.createIndex('scheduledTime', 'scheduledTime', { unique: false });
          doseStore.createIndex('status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('alerts')) {
          const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
          alertStore.createIndex('status', 'status', { unique: false });
          alertStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const db = new CareDoseDB();
