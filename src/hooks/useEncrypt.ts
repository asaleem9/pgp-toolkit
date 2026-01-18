import { useState, useCallback } from 'react';
import { encryptMessage, parsePublicKey, KeyInfo } from '../utils/pgp';
import { validatePublicKey, validatePlaintext } from '../utils/validation';

export interface Recipient {
  id: string;
  key: string;
  keyInfo: KeyInfo | null;
  error: string | null;
}

interface UseEncryptState {
  recipients: Recipient[];
  message: string;
  encryptedOutput: string;
  error: string | null;
  isLoading: boolean;
  encryptToSelf: boolean;
  selfKey: string;
  selfKeyInfo: KeyInfo | null;
  selfKeyError: string | null;
}

interface UseEncryptReturn extends UseEncryptState {
  // Single recipient mode (backwards compatible)
  publicKey: string;
  keyInfo: KeyInfo | null;
  setPublicKey: (key: string) => void;
  // Multi-recipient mode
  addRecipient: () => void;
  removeRecipient: (id: string) => void;
  updateRecipient: (id: string, key: string) => void;
  validateRecipient: (id: string) => Promise<boolean>;
  // Encrypt to self
  setEncryptToSelf: (enabled: boolean) => void;
  setSelfKey: (key: string) => void;
  validateSelfKey: () => Promise<boolean>;
  // Common
  setMessage: (message: string) => void;
  encrypt: () => Promise<void>;
  clearAll: () => void;
  validateKey: () => Promise<boolean>;
}

const createRecipient = (): Recipient => ({
  id: Math.random().toString(36).substring(2, 9),
  key: '',
  keyInfo: null,
  error: null,
});

export function useEncrypt(): UseEncryptReturn {
  const [state, setState] = useState<UseEncryptState>({
    recipients: [createRecipient()],
    message: '',
    encryptedOutput: '',
    error: null,
    isLoading: false,
    encryptToSelf: false,
    selfKey: '',
    selfKeyInfo: null,
    selfKeyError: null,
  });

  // Backwards compatible accessors for single recipient mode
  const publicKey = state.recipients[0]?.key ?? '';
  const keyInfo = state.recipients[0]?.keyInfo ?? null;

  const setPublicKey = useCallback((key: string) => {
    setState(prev => {
      const newRecipients = [...prev.recipients];
      if (newRecipients.length === 0) {
        newRecipients.push(createRecipient());
      }
      newRecipients[0] = {
        ...newRecipients[0],
        key,
        keyInfo: null,
        error: null,
      };
      return {
        ...prev,
        recipients: newRecipients,
        error: null,
      };
    });
  }, []);

  const addRecipient = useCallback(() => {
    setState(prev => {
      if (prev.recipients.length >= 10) {
        return prev; // Limit to 10 recipients
      }
      return {
        ...prev,
        recipients: [...prev.recipients, createRecipient()],
        error: null,
      };
    });
  }, []);

  const removeRecipient = useCallback((id: string) => {
    setState(prev => {
      if (prev.recipients.length <= 1) {
        return prev; // Keep at least one recipient
      }
      return {
        ...prev,
        recipients: prev.recipients.filter(r => r.id !== id),
        error: null,
      };
    });
  }, []);

  const updateRecipient = useCallback((id: string, key: string) => {
    setState(prev => ({
      ...prev,
      recipients: prev.recipients.map(r =>
        r.id === id ? { ...r, key, keyInfo: null, error: null } : r
      ),
      error: null,
    }));
  }, []);

  const validateRecipient = useCallback(async (id: string): Promise<boolean> => {
    const recipient = state.recipients.find(r => r.id === id);
    if (!recipient) return false;

    const validation = validatePublicKey(recipient.key);
    if (!validation.valid) {
      setState(prev => ({
        ...prev,
        recipients: prev.recipients.map(r =>
          r.id === id ? { ...r, error: validation.error ?? null, keyInfo: null } : r
        ),
      }));
      return false;
    }

    const parsedKeyInfo = await parsePublicKey(recipient.key);
    if (!parsedKeyInfo) {
      setState(prev => ({
        ...prev,
        recipients: prev.recipients.map(r =>
          r.id === id
            ? { ...r, error: "This doesn't appear to be a valid PGP public key.", keyInfo: null }
            : r
        ),
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      recipients: prev.recipients.map(r =>
        r.id === id ? { ...r, keyInfo: parsedKeyInfo, error: null } : r
      ),
    }));
    return true;
  }, [state.recipients]);

  const setEncryptToSelf = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      encryptToSelf: enabled,
      selfKeyError: null,
    }));
  }, []);

  const setSelfKey = useCallback((key: string) => {
    setState(prev => ({
      ...prev,
      selfKey: key,
      selfKeyInfo: null,
      selfKeyError: null,
    }));
  }, []);

  const validateSelfKey = useCallback(async (): Promise<boolean> => {
    if (!state.selfKey.trim()) {
      setState(prev => ({
        ...prev,
        selfKeyError: 'Your public key is required when "encrypt to self" is enabled',
        selfKeyInfo: null,
      }));
      return false;
    }

    const validation = validatePublicKey(state.selfKey);
    if (!validation.valid) {
      setState(prev => ({
        ...prev,
        selfKeyError: validation.error ?? null,
        selfKeyInfo: null,
      }));
      return false;
    }

    const parsedKeyInfo = await parsePublicKey(state.selfKey);
    if (!parsedKeyInfo) {
      setState(prev => ({
        ...prev,
        selfKeyError: "This doesn't appear to be a valid PGP public key.",
        selfKeyInfo: null,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      selfKeyInfo: parsedKeyInfo,
      selfKeyError: null,
    }));
    return true;
  }, [state.selfKey]);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message,
      error: null,
    }));
  }, []);

  const validateKey = useCallback(async (): Promise<boolean> => {
    // Validate first recipient (backwards compatible)
    if (state.recipients.length === 0) return false;
    return validateRecipient(state.recipients[0].id);
  }, [state.recipients, validateRecipient]);

  const encrypt = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, encryptedOutput: '' }));

    // Validate all recipients have keys
    const validRecipients = state.recipients.filter(r => r.key.trim());
    if (validRecipients.length === 0) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'At least one public key is required',
      }));
      return;
    }

    // Validate each key
    for (const recipient of validRecipients) {
      const validation = validatePublicKey(recipient.key);
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          recipients: prev.recipients.map(r =>
            r.id === recipient.id ? { ...r, error: validation.error ?? null } : r
          ),
          error: 'One or more keys are invalid',
        }));
        return;
      }
    }

    // Validate self key if encrypt to self is enabled
    if (state.encryptToSelf) {
      if (!state.selfKey.trim()) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          selfKeyError: 'Your public key is required when "encrypt to self" is enabled',
        }));
        return;
      }

      const selfValidation = validatePublicKey(state.selfKey);
      if (!selfValidation.valid) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          selfKeyError: selfValidation.error ?? null,
        }));
        return;
      }
    }

    // Validate message
    const messageValidation = validatePlaintext(state.message);
    if (!messageValidation.valid) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: messageValidation.error ?? null,
      }));
      return;
    }

    // Perform encryption with all keys (including self key if enabled)
    const keys = validRecipients.map(r => r.key);
    if (state.encryptToSelf && state.selfKey.trim()) {
      keys.push(state.selfKey);
    }
    const result = await encryptMessage(state.message, keys);

    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        encryptedOutput: result.data!,
        error: null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error ?? 'Encryption failed',
      }));
    }
  }, [state.recipients, state.message, state.encryptToSelf, state.selfKey]);

  const clearAll = useCallback(() => {
    setState({
      recipients: [createRecipient()],
      message: '',
      encryptedOutput: '',
      error: null,
      isLoading: false,
      encryptToSelf: false,
      selfKey: '',
      selfKeyInfo: null,
      selfKeyError: null,
    });
  }, []);

  return {
    ...state,
    publicKey,
    keyInfo,
    setPublicKey,
    addRecipient,
    removeRecipient,
    updateRecipient,
    validateRecipient,
    setEncryptToSelf,
    setSelfKey,
    validateSelfKey,
    setMessage,
    encrypt,
    clearAll,
    validateKey,
  };
}
