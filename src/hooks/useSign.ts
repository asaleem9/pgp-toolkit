import { useState, useCallback } from 'react';
import { signMessage, parsePrivateKey, KeyInfo } from '../utils/pgp';

interface UseSignState {
  privateKey: string;
  passphrase: string;
  message: string;
  signedOutput: string;
  keyInfo: KeyInfo | null;
  error: string | null;
  isLoading: boolean;
  needsPassphrase: boolean;
  detachedSignature: boolean;
}

interface UseSignReturn extends UseSignState {
  setPrivateKey: (key: string) => void;
  setPassphrase: (passphrase: string) => void;
  setMessage: (message: string) => void;
  setDetachedSignature: (detached: boolean) => void;
  sign: () => Promise<void>;
  clearAll: () => void;
  validateKey: () => Promise<boolean>;
}

export function useSign(): UseSignReturn {
  const [state, setState] = useState<UseSignState>({
    privateKey: '',
    passphrase: '',
    message: '',
    signedOutput: '',
    keyInfo: null,
    error: null,
    isLoading: false,
    needsPassphrase: false,
    detachedSignature: false,
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

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message,
      error: null,
    }));
  }, []);

  const setDetachedSignature = useCallback((detached: boolean) => {
    setState(prev => ({
      ...prev,
      detachedSignature: detached,
    }));
  }, []);

  const validateKey = useCallback(async (): Promise<boolean> => {
    if (!state.privateKey.trim()) {
      setState(prev => ({ ...prev, error: 'Private key is required', keyInfo: null }));
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

  const sign = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, signedOutput: '' }));

    if (!state.privateKey.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Private key is required',
      }));
      return;
    }

    if (!state.message.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Message is required',
      }));
      return;
    }

    const result = await signMessage(
      state.message,
      state.privateKey,
      state.passphrase || undefined,
      state.detachedSignature
    );

    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        signedOutput: result.data!,
        error: null,
      }));
    } else {
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
          error: result.error ?? 'Signing failed',
        }));
      }
    }
  }, [state.privateKey, state.message, state.passphrase, state.detachedSignature]);

  const clearAll = useCallback(() => {
    setState({
      privateKey: '',
      passphrase: '',
      message: '',
      signedOutput: '',
      keyInfo: null,
      error: null,
      isLoading: false,
      needsPassphrase: false,
      detachedSignature: false,
    });
  }, []);

  return {
    ...state,
    setPrivateKey,
    setPassphrase,
    setMessage,
    setDetachedSignature,
    sign,
    clearAll,
    validateKey,
  };
}
