import { useState, useCallback } from 'react';
import { signMessage, parsePrivateKey, KeyInfo } from '../utils/pgp';
import { validatePlaintext } from '../utils/validation';

export type SignErrorField = 'privateKey' | 'passphrase' | 'message' | 'general';

interface UseSignState {
  privateKey: string;
  passphrase: string;
  message: string;
  signedOutput: string;
  keyInfo: KeyInfo | null;
  error: string | null;
  errorField: SignErrorField | null;
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
    errorField: null,
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
      errorField: null,
      needsPassphrase: false,
    }));
  }, []);

  const setPassphrase = useCallback((passphrase: string) => {
    setState(prev => ({
      ...prev,
      passphrase,
      error: null,
      errorField: null,
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message,
      error: null,
      errorField: null,
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
      setState(prev => ({
        ...prev,
        error: 'Private key is required',
        errorField: 'privateKey',
        keyInfo: null,
      }));
      return false;
    }

    const keyInfo = await parsePrivateKey(state.privateKey);
    if (!keyInfo) {
      setState(prev => ({
        ...prev,
        error: "This doesn't appear to be a valid PGP private key. Please check and try again.",
        errorField: 'privateKey',
        keyInfo: null,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      keyInfo,
      needsPassphrase: keyInfo.isEncrypted ?? false,
      error: null,
      errorField: null,
    }));
    return true;
  }, [state.privateKey]);

  const sign = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, errorField: null, signedOutput: '' }));

    if (!state.privateKey.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Private key is required',
        errorField: 'privateKey',
      }));
      return;
    }

    const messageValidation = validatePlaintext(state.message);
    if (!messageValidation.valid) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: messageValidation.error ?? null,
        errorField: 'message',
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
        errorField: null,
      }));
    } else if (result.code === 'NEEDS_PASSPHRASE' || result.code === 'WRONG_PASSPHRASE') {
      setState(prev => ({
        ...prev,
        isLoading: false,
        needsPassphrase: true,
        error: result.error ?? null,
        errorField: 'passphrase',
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error ?? 'Signing failed',
        errorField: 'general',
      }));
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
      errorField: null,
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
