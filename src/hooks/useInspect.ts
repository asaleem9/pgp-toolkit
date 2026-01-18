import { useState, useCallback } from 'react';
import { inspectKey, DetailedKeyInfo } from '../utils/pgp';

interface UseInspectState {
  keyText: string;
  keyInfo: DetailedKeyInfo | null;
  error: string | null;
  isLoading: boolean;
}

interface UseInspectReturn extends UseInspectState {
  setKeyText: (text: string) => void;
  inspect: () => Promise<void>;
  clearAll: () => void;
}

export function useInspect(): UseInspectReturn {
  const [state, setState] = useState<UseInspectState>({
    keyText: '',
    keyInfo: null,
    error: null,
    isLoading: false,
  });

  const setKeyText = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      keyText: text,
      error: null,
    }));
  }, []);

  const inspect = useCallback(async () => {
    if (!state.keyText.trim()) {
      setState(prev => ({ ...prev, error: 'Please paste a PGP key to inspect' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, keyInfo: null }));

    const info = await inspectKey(state.keyText);

    if (info) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        keyInfo: info,
        error: null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Could not parse this key. Make sure it's a valid PGP public or private key.",
      }));
    }
  }, [state.keyText]);

  const clearAll = useCallback(() => {
    setState({
      keyText: '',
      keyInfo: null,
      error: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    setKeyText,
    inspect,
    clearAll,
  };
}
