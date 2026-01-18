/**
 * Tests for useDecrypt hook
 * Target: 95%+ coverage (critical path)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDecrypt } from '../useDecrypt';
import { TEST_KEYS, TEST_MESSAGES } from '../../test/fixtures/keys';
import {
  mockReadPrivateKey,
  mockDecrypt,
  mockDecryptKey,
  mockReadMessage,
  createMockKey,
  setupDefaultMocks,
  resetMocks,
} from '../../test/helpers/mockOpenpgp';

// Mock the modules
vi.mock('openpgp', async () => {
  const mockHelpers = await import('../../test/helpers/mockOpenpgp');
  return {
    readKey: mockHelpers.mockReadKey,
    readPrivateKey: mockHelpers.mockReadPrivateKey,
    encrypt: mockHelpers.mockEncrypt,
    decrypt: mockHelpers.mockDecrypt,
    sign: mockHelpers.mockSign,
    verify: mockHelpers.mockVerify,
    createMessage: mockHelpers.mockCreateMessage,
    createCleartextMessage: mockHelpers.mockCreateCleartextMessage,
    readMessage: mockHelpers.mockReadMessage,
    readCleartextMessage: mockHelpers.mockReadCleartextMessage,
    decryptKey: mockHelpers.mockDecryptKey,
  };
});

describe('useDecrypt - State Management', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useDecrypt());

    expect(result.current.privateKey).toBe('');
    expect(result.current.passphrase).toBe('');
    expect(result.current.encryptedMessage).toBe('');
    expect(result.current.decryptedOutput).toBe('');
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.needsPassphrase).toBe(false);
  });

  it('should update private key', () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    expect(result.current.privateKey).toBe(TEST_KEYS.alice.privateKey);
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.needsPassphrase).toBe(false);
  });

  it('should update passphrase', () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPassphrase('test-passphrase');
    });

    expect(result.current.passphrase).toBe('test-passphrase');
    expect(result.current.error).toBeNull();
  });

  it('should update encrypted message', () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    expect(result.current.encryptedMessage).toBe(TEST_MESSAGES.encryptedToAlice);
    expect(result.current.error).toBeNull();
  });

  it('should reset to initial state with clearAll', () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setPassphrase('test');
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.privateKey).toBe('');
    expect(result.current.passphrase).toBe('');
    expect(result.current.encryptedMessage).toBe('');
    expect(result.current.decryptedOutput).toBe('');
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.needsPassphrase).toBe(false);
  });
});

describe('useDecrypt - Key Validation', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should validate valid private key format', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateKey();
    });

    expect(isValid).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.keyInfo).toBeTruthy();
  });

  it('should detect invalid private key format', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey('INVALID KEY');
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateKey();
    });

    expect(isValid).toBe(false);
    expect(result.current.error).toContain('valid PGP private key');
    expect(result.current.keyInfo).toBeNull();
  });

  it('should detect encrypted private keys (needsPassphrase)', async () => {
    const mockKey = createMockKey({ isDecrypted: false });
    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.bob.privateKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.needsPassphrase).toBe(true);
    expect(result.current.keyInfo?.isEncrypted).toBe(true);
  });

  it('should detect unencrypted private keys', async () => {
    const mockKey = createMockKey({ isDecrypted: true });
    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.needsPassphrase).toBe(false);
    expect(result.current.keyInfo?.isEncrypted).toBe(false);
  });

  it('should update keyInfo on successful validation', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
    });
    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.keyInfo).toBeTruthy();
    expect(result.current.keyInfo?.fingerprint).toBe(TEST_KEYS.alice.fingerprint);
  });

  it('should handle parsing failures', async () => {
    mockReadPrivateKey.mockRejectedValue(new Error('Parsing error'));

    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateKey();
    });

    expect(isValid).toBe(false);
    expect(result.current.error).toContain('valid PGP private key');
  });
});

describe('useDecrypt - Decryption Flow', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should decrypt message with unencrypted private key', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.decryptedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
    expect(mockDecrypt).toHaveBeenCalledTimes(1);
  });

  it('should decrypt with encrypted key and passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    const mockDecryptedKey = createMockKey({ isDecrypted: true });

    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);
    mockDecryptKey.mockResolvedValue(mockDecryptedKey as any);

    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.bob.privateKey);
      result.current.setPassphrase(TEST_KEYS.bob.passphrase!);
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.decryptedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should fail with empty private key', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('required');
    expect(result.current.decryptedOutput).toBe('');
  });

  it('should fail with invalid private key format', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey('INVALID KEY');
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.decryptedOutput).toBe('');
  });

  it('should fail with empty encrypted message', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setEncryptedMessage('');
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('required');
    expect(result.current.decryptedOutput).toBe('');
  });

  it('should fail with invalid encrypted message format', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setEncryptedMessage('INVALID MESSAGE');
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.decryptedOutput).toBe('');
  });

  it('should fail with wrong private key', async () => {
    mockDecrypt.mockResolvedValue({
      success: false,
      error: 'Could not decrypt this message. Make sure you\'re using the correct private key.',
    });

    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.bob.privateKey);
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.decryptedOutput).toBe('');
  });

  it('should handle decryption errors', async () => {
    mockDecrypt.mockResolvedValue({
      success: false,
      error: 'Decryption failed',
    });

    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.decryptedOutput).toBe('');
  });

  it('should manage loading state correctly', async () => {
    const { result } = renderHook(() => useDecrypt());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.decryptedOutput).toBeDefined();
  });

  it('should clear previous output on new decryption', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    const firstOutput = result.current.decryptedOutput;
    expect(firstOutput).toBeTruthy();

    // Decrypt again with different result
    mockDecrypt.mockResolvedValueOnce({
      success: true,
      data: 'New decrypted message',
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.decryptedOutput).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useDecrypt - Passphrase Handling', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should not require passphrase for unencrypted keys', async () => {
    const { result } = renderHook(() => useDecrypt());

    const mockUnencryptedKey = createMockKey({ isDecrypted: true });
    mockReadPrivateKey.mockResolvedValue(mockUnencryptedKey as any);

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.needsPassphrase).toBe(false);

    // Should decrypt without passphrase
    act(() => {
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.decryptedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should handle passphrase correctly', async () => {
    const { result } = renderHook(() => useDecrypt());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setPassphrase('');
      result.current.setEncryptedMessage(TEST_MESSAGES.encryptedToAlice);
    });

    await act(async () => {
      await result.current.decrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.decryptedOutput).toBeDefined();
  });
});
