// src/services/crypto.ts

export interface KeyPairExport {
  publicKeyBase64: string;
  fingerprint: string;
  verificationCode: string;
}

export class CryptoEngine {
  // Generate an ephemeral or identity ECDH key pair (P-256)
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey']
    );
  }

  // Export public key to base64 for QR code generation
  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const raw = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(raw)));
  }

  // Import peer's public key from base64
  static async importPublicKey(base64: string): Promise<CryptoKey> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return await window.crypto.subtle.importKey(
      'raw',
      bytes.buffer,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
  }

  // Derive AES-GCM shared secret from my private key and remote peer public key
  static async deriveSharedSecret(myPrivateKey: CryptoKey, peerPublicKey: CryptoKey): Promise<CryptoKey> {
    return await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: peerPublicKey },
      myPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt payload using AES-GCM with a fresh random 12-byte IV
  static async encryptPayload(sharedKey: CryptoKey, plainData: object): Promise<{ iv: string; cipher: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(plainData));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      encoded
    );
    return {
      iv: btoa(String.fromCharCode(...iv)),
      cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };
  }

  // Decrypt payload with AES-GCM
  static async decryptPayload(sharedKey: CryptoKey, ivBase64: string, cipherBase64: string): Promise<any> {
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const cipher = new Uint8Array(atob(cipherBase64).split('').map(c => c.charCodeAt(0)));
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      cipher
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  // Calculate human-verifiable 6-digit cryptographic security code from public key string
  static async get6DigitVerificationCode(publicKeyStr: string): Promise<string> {
    const buffer = new TextEncoder().encode(publicKeyStr);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Pick bytes to form a 6-digit number
    const num = ((hashArray[0] << 16) | (hashArray[1] << 8) | hashArray[2]) % 1000000;
    return num.toString().padStart(6, '0');
  }

  // Calculate short fingerprint
  static async getFingerprint(publicKeyStr: string): Promise<string> {
    const buffer = new TextEncoder().encode(publicKeyStr);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.slice(0, 4).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
  }
}
