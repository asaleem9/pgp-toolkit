import { useState, useCallback } from 'react';
import { verifySignature, verifyDetachedSignature, parsePublicKey, KeyInfo, VerifyResult } from '../utils/pgp';
import { validateMessageSize } from '../utils/validation';

export type VerifyMode = 'inline' | 'detached';
export type VerifyErrorField = 'publicKey' | 'originalMessage' | 'signature' | 'general';

interface UseVerifyState {
  publicKey: string;
  signedMessage: string;
  originalMessage: string;
  mode: VerifyMode;
  result: VerifyResult | null;
  keyInfo: KeyInfo | null;
  error: string | null;
  errorField: VerifyErrorField | null;
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
    errorField: null,
    isLoading: false,
  });

  const setPublicKey = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      publicKey: key,
      keyInfo: null,
      error: null,
      errorField: null,
      result: null,
    }));
  }, []);

  const setSignedMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      signedMessage: message,
      error: null,
      errorField: null,
      result: null,
    }));
  }, []);

  const setOriginalMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      originalMessage: message,
      error: null,
      errorField: null,
      result: null,
    }));
  }, []);

  const setMode = useCallback((mode: VerifyMode) => {
    setState(prev => ({
      ...prev,
      mode,
      error: null,
      errorField: null,
      result: null,
    }));
  }, []);

  const validateKey = useCallback(async (): Promise<boolean> => {
    if (!state.publicKey.trim()) {
      setState(prev => ({ ...prev, error: 'Public key is required', errorField: 'publicKey', keyInfo: null }));
      return false;
    }

    const keyInfo = await parsePublicKey(state.publicKey);
    if (!keyInfo) {
      setState(prev => ({
        ...prev,
        error: "This doesn't appear to be a valid PGP public key. Please check and try again.",
        errorField: 'publicKey',
        keyInfo: null,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      keyInfo,
      error: null,
      errorField: null,
    }));
    return true;
  }, [state.publicKey]);

  const verify = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, errorField: null, result: null }));

    if (!state.publicKey.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Public key is required',
        errorField: 'publicKey',
      }));
      return;
    }

    if (!state.signedMessage.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: state.mode === 'detached' ? 'Signature is required' : 'Signed message is required',
        errorField: 'signature',
      }));
      return;
    }

    const signedSize = validateMessageSize(state.signedMessage);
    if (!signedSize.valid) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: signedSize.error ?? null,
        errorField: 'signature',
      }));
      return;
    }

    if (state.mode === 'detached' && !state.originalMessage.trim()) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'The original message is required to verify a detached signature',
        errorField: 'originalMessage',
      }));
      return;
    }

    if (state.mode === 'detached') {
      const originalSize = validateMessageSize(state.originalMessage);
      if (!originalSize.valid) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: originalSize.error ?? null,
          errorField: 'originalMessage',
        }));
        return;
      }
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
        errorField: null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        result: null,
        error: result.error ?? 'Verification failed',
        errorField: 'general',
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
      errorField: null,
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
