import { useState, useCallback } from 'react';
import * as openpgp from 'openpgp';
import { isValidEmail } from '../utils/validation';

export type KeyAlgorithm = 'ecc' | 'rsa';
export type ECCCurve = 'curve25519' | 'p256' | 'p384' | 'p521';
export type RSABits = 2048 | 3072 | 4096;

interface GeneratedKeys {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
  keyId: string;
  isProtected: boolean;
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
  const [passphrase, setPassphraseState] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [algorithm, setAlgorithm] = useState<KeyAlgorithm>('ecc');
  const [curve, setCurve] = useState<ECCCurve>('curve25519');
  const [rsaBits, setRsaBits] = useState<RSABits>(4096);
  const [expirationYears, setExpirationYears] = useState(2);
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeys | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clearing the passphrase hides the confirm field, so drop its stale value
  // too - otherwise the passphrase checks silently stop applying
  const setPassphrase = useCallback((value: string) => {
    setPassphraseState(value);
    if (!value) {
      setConfirmPassphrase('');
    }
  }, []);

  const clearAll = useCallback(() => {
    setName('');
    setEmail('');
    setPassphraseState('');
    setConfirmPassphrase('');
    setAlgorithm('ecc');
    setCurve('curve25519');
    setRsaBits(4096);
    setExpirationYears(2);
    setGeneratedKeys(null);
    setError(null);
  }, []);

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

    if (!isValidEmail(email)) {
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

      // Expiration is expressed in seconds from now; use calendar years so
      // "2 years" lands on the same date instead of drifting across leap years
      let keyExpirationTime: number | undefined;
      if (expirationYears > 0) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + expirationYears);
        keyExpirationTime = Math.floor((expiry.getTime() - Date.now()) / 1000);
      }

      const commonOptions = {
        userIDs: userIds,
        passphrase: passphrase || undefined,
        keyExpirationTime,
        format: 'armored' as const,
      };

      const { privateKey, publicKey } = algorithm === 'ecc'
        ? await openpgp.generateKey({ ...commonOptions, type: 'ecc', curve: curve as openpgp.EllipticCurveName })
        : await openpgp.generateKey({ ...commonOptions, type: 'rsa', rsaBits });

      // Parse the key to get fingerprint and key ID
      const parsedKey = await openpgp.readKey({ armoredKey: publicKey });
      const fingerprint = parsedKey.getFingerprint().toUpperCase();
      const keyId = parsedKey.getKeyID().toHex().toUpperCase();

      setGeneratedKeys({
        publicKey,
        privateKey,
        fingerprint,
        keyId,
        isProtected: passphrase.length > 0,
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
