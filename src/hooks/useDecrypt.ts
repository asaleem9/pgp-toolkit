import { useState, useCallback } from 'react';
import { decryptMessage, parsePrivateKey, KeyInfo } from '../utils/pgp';
import { validatePrivateKey, validateEncryptedMessage } from '../utils/validation';

interface UseDecryptState {
  privateKey: string;
  passphrase: string;
  encryptedMessage: string;
  decryptedOutput: string;
  keyInfo: KeyInfo | null;
  error: string | null;
  isLoading: boolean;
  needsPassphrase: boolean;
}

interface UseDecryptReturn extends UseDecryptState {
  setPrivateKey: (key: string) => void;
  setPassphrase: (passphrase: string) => void;
  setEncryptedMessage: (message: string) => void;
  decrypt: () => Promise<void>;
  clearAll: () => void;
  validateKey: () => Promise<boolean>;
}

export function useDecrypt(): UseDecryptReturn {
  const [state, setState] = useState<UseDecryptState>({
    privateKey: '',
    passphrase: '',
    encryptedMessage: '',
    decryptedOutput: '',
    keyInfo: null,
    error: null,
    isLoading: false,
    needsPassphrase: false,
  });

  const setPrivateKey = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      privateKey: key,
      keyInfo: null,
      error: null,
      needsPassphrase: false,
    }));
  }, []);

  const setPassphrase = useCallback((passphrase: string) => {
    setState(prev => ({
      ...prev,
      passphrase,
      error: null,
    }));
  }, []);

  const setEncryptedMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      encryptedMessage: message,
      error: null,
    }));
  }, []);

  const validateKey = useCallback(async (): Promise<boolean> => {
    const validation = validatePrivateKey(state.privateKey);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error ?? null, keyInfo: null }));
      return false;
    }

    const keyInfo = await parsePrivateKey(state.privateKey);
    if (!keyInfo) {
      setState(prev => ({
        ...prev,
        error: "This doesn't appear to be a valid PGP private key. Please check and try again.",
        keyInfo: null,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      keyInfo,
      needsPassphrase: keyInfo.isEncrypted ?? false,
      error: null,
    }));
    return true;
  }, [state.privateKey]);

  const decrypt = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, decryptedOutput: '' }));

    // Validate private key
    const keyValidation = validatePrivateKey(state.privateKey);
    if (!keyValidation.valid) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: keyValidation.error ?? null,
      }));
      return;
    }

    // Validate encrypted message
    const messageValidation = validateEncryptedMessage(state.encryptedMessage);
    if (!messageValidation.valid) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: messageValidation.error ?? null,
      }));
      return;
    }

    // Perform decryption
    const result = await decryptMessage(
      state.encryptedMessage,
      state.privateKey,
      state.passphrase || undefined
    );

    if (result.success && result.data !== undefined) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        decryptedOutput: result.data!,
        error: null,
      }));
    } else {
      // Check if passphrase is needed
      if (result.error?.includes('passphrase')) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          needsPassphrase: true,
          error: result.error ?? null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error ?? 'Decryption failed',
        }));
      }
    }
  }, [state.privateKey, state.encryptedMessage, state.passphrase]);

  const clearAll = useCallback(() => {
    setState({
      privateKey: '',
      passphrase: '',
      encryptedMessage: '',
      decryptedOutput: '',
      keyInfo: null,
      error: null,
      isLoading: false,
      needsPassphrase: false,
    });
  }, []);

  return {
    ...state,
    setPrivateKey,
    setPassphrase,
    setEncryptedMessage,
    decrypt,
    clearAll,
    validateKey,
  };
}
