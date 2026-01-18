import { useState, useCallback } from 'react';
import * as openpgp from 'openpgp';
import { clearString } from '../utils/sanitize';

export type KeyAlgorithm = 'ecc' | 'rsa';
export type ECCCurve = 'curve25519' | 'p256' | 'p384' | 'p521';
export type RSABits = 2048 | 3072 | 4096;

interface GeneratedKeys {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  keyId: string;
}

interface UseGenerateReturn {
  name: string;
  email: string;
  passphrase: string;
  confirmPassphrase: string;
  algorithm: KeyAlgorithm;
  curve: ECCCurve;
  rsaBits: RSABits;
  expirationYears: number;
  generatedKeys: GeneratedKeys | null;
  error: string | null;
  isLoading: boolean;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassphrase: (passphrase: string) => void;
  setConfirmPassphrase: (passphrase: string) => void;
  setAlgorithm: (algorithm: KeyAlgorithm) => void;
  setCurve: (curve: ECCCurve) => void;
  setRsaBits: (bits: RSABits) => void;
  setExpirationYears: (years: number) => void;
  generate: () => Promise<void>;
  clearAll: () => void;
}

export function useGenerate(): UseGenerateReturn {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [algorithm, setAlgorithm] = useState<KeyAlgorithm>('ecc');
  const [curve, setCurve] = useState<ECCCurve>('curve25519');
  const [rsaBits, setRsaBits] = useState<RSABits>(4096);
  const [expirationYears, setExpirationYears] = useState(2);
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeys | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearAll = useCallback(() => {
    clearString(passphrase);
    clearString(confirmPassphrase);
    if (generatedKeys) {
      clearString(generatedKeys.privateKey);
    }
    setName('');
    setEmail('');
    setPassphrase('');
    setConfirmPassphrase('');
    setAlgorithm('ecc');
    setCurve('curve25519');
    setRsaBits(4096);
    setExpirationYears(2);
    setGeneratedKeys(null);
    setError(null);
  }, [passphrase, confirmPassphrase, generatedKeys]);

  const generate = useCallback(async () => {
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (passphrase && passphrase !== confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }

    if (passphrase && passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const userIds = [{ name: name.trim(), email: email.trim() }];

      // Calculate expiration date
      const expirationDate = expirationYears > 0
        ? new Date(Date.now() + expirationYears * 365 * 24 * 60 * 60 * 1000)
        : undefined; // undefined means no expiration

      let keyOptions: openpgp.GenerateKeyOptions;

      if (algorithm === 'ecc') {
        keyOptions = {
          type: 'ecc',
          curve: curve,
          userIDs: userIds,
          passphrase: passphrase || undefined,
          keyExpirationTime: expirationDate
            ? Math.floor((expirationDate.getTime() - Date.now()) / 1000)
            : undefined,
          format: 'armored',
        };
      } else {
        keyOptions = {
          type: 'rsa',
          rsaBits: rsaBits,
          userIDs: userIds,
          passphrase: passphrase || undefined,
          keyExpirationTime: expirationDate
            ? Math.floor((expirationDate.getTime() - Date.now()) / 1000)
            : undefined,
          format: 'armored',
        };
      }

      const { privateKey, publicKey } = await openpgp.generateKey(keyOptions);

      // Parse the key to get fingerprint and key ID
      const parsedKey = await openpgp.readKey({ armoredKey: publicKey });
      const fingerprint = parsedKey.getFingerprint().toUpperCase();
      const keyId = parsedKey.getKeyID().toHex().toUpperCase();

      setGeneratedKeys({
        publicKey,
        privateKey,
        fingerprint,
        keyId,
      });
    } catch (err) {
      console.error('Key generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate keys');
    } finally {
      setIsLoading(false);
    }
  }, [name, email, passphrase, confirmPassphrase, algorithm, curve, rsaBits, expirationYears]);

  return {
    name,
    email,
    passphrase,
    confirmPassphrase,
    algorithm,
    curve,
    rsaBits,
    expirationYears,
    generatedKeys,
    error,
    isLoading,
    setName,
    setEmail,
    setPassphrase,
    setConfirmPassphrase,
    setAlgorithm,
    setCurve,
    setRsaBits,
    setExpirationYears,
    generate,
    clearAll,
  };
}
