import { useState, useCallback } from 'react';
import { verifySignature, verifyDetachedSignature, parsePublicKey, KeyInfo, VerifyResult } from '../utils/pgp';

export type VerifyMode = 'inline' | 'detached';

interface UseVerifyState {
  publicKey: string;
  signedMessage: string;
  originalMessage: string;
  mode: VerifyMode;
  result: VerifyResult | null;
  keyInfo: KeyInfo | null;
  error: string | null;
  isLoading: boolean;
}

interface UseVerifyReturn extends UseVerifyState {
  setPublicKey: (key: string) => void;
  setSignedMessage: (message: string) => void;
  setOriginalMessage: (message: string) => void;
  setMode: (mode: VerifyMode) => void;
  verify: () => Promise<void>;
  clearAll: () => void;
  validateKey: () => Promise<boolean>;
}

export function useVerify(): UseVerifyReturn {
  const [state, setState] = useState<UseVerifyState>({
    publicKey: '',
    signedMessage: '',
    originalMessage: '',
    mode: 'inline',
    result: null,
    keyInfo: null,
    error: null,
    isLoading: false,
  });

  const setPublicKey = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      publicKey: key,
      keyInfo: null,
      error: null,
      result: null,
    }));
  }, []);

  const setSignedMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      signedMessage: message,
      error: null,
      result: null,
    }));
  }, []);

  const setOriginalMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      originalMessage: message,
      error: null,
      result: null,
    }));
  }, []);

  const setMode = useCallback((mode: VerifyMode) => {
    setState(prev => ({
      ...prev,
      mode,
      error: null,
      result: null,
    }));
  }, []);

  const validateKey = useCallback(async (): Promise<boolean> => {
    if (!state.publicKey.trim()) {
      setState(prev => ({ ...prev, error: 'Public key is required', keyInfo: null }));
      return false;
    }

    const keyInfo = await parsePublicKey(state.publicKey);
    if (!keyInfo) {
      setState(prev => ({
        ...prev,
        error: "This doesn't appear to be a valid PGP public key. Please check and try again.",
        keyInfo: null,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      keyInfo,
      error: null,
    }));
    return true;
  }, [state.publicKey]);

  const verify = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, result: null }));

    if (!state.publicKey.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Public key is required',
      }));
      return;
    }

    if (!state.signedMessage.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: state.mode === 'detached' ? 'Signature is required' : 'Signed message is required',
      }));
      return;
    }

    if (state.mode === 'detached' && !state.originalMessage.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'The original message is required to verify a detached signature',
      }));
      return;
    }

    const result = state.mode === 'detached'
      ? await verifyDetachedSignature(state.originalMessage, state.signedMessage, state.publicKey)
      : await verifySignature(state.signedMessage, state.publicKey);

    if (result.success) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        result,
        error: null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        result: null,
        error: result.error ?? 'Verification failed',
      }));
    }
  }, [state.publicKey, state.signedMessage, state.originalMessage, state.mode]);

  const clearAll = useCallback(() => {
    setState({
      publicKey: '',
      signedMessage: '',
      originalMessage: '',
      mode: 'inline',
      result: null,
      keyInfo: null,
      error: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    setPublicKey,
    setSignedMessage,
    setOriginalMessage,
    setMode,
    verify,
    clearAll,
    validateKey,
  };
}
