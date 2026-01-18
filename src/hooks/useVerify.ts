import { useState, useCallback } from 'react';
import { verifySignature, parsePublicKey, KeyInfo, VerifyResult } from '../utils/pgp';

interface UseVerifyState {
  publicKey: string;
  signedMessage: string;
  result: VerifyResult | null;
  keyInfo: KeyInfo | null;
  error: string | null;
  isLoading: boolean;
}

interface UseVerifyReturn extends UseVerifyState {
  setPublicKey: (key: string) => void;
  setSignedMessage: (message: string) => void;
  verify: () => Promise<void>;
  clearAll: () => void;
  validateKey: () => Promise<boolean>;
}

export function useVerify(): UseVerifyReturn {
  const [state, setState] = useState<UseVerifyState>({
    publicKey: '',
    signedMessage: '',
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
        error: 'Signed message is required',
      }));
      return;
    }

    const result = await verifySignature(state.signedMessage, state.publicKey);

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
  }, [state.publicKey, state.signedMessage]);

  const clearAll = useCallback(() => {
    setState({
      publicKey: '',
      signedMessage: '',
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
    verify,
    clearAll,
    validateKey,
  };
}
