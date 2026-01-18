/**
 * Tests for useSign hook
 * Target: 90%+ coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSign } from '../useSign';
import { TEST_KEYS, TEST_MESSAGES } from '../../test/fixtures/keys';
import {
  mockReadPrivateKey,
  mockSign,
  mockDecryptKey,
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

describe('useSign - State Management', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useSign());

    expect(result.current.privateKey).toBe('');
    expect(result.current.passphrase).toBe('');
    expect(result.current.message).toBe('');
    expect(result.current.signedOutput).toBe('');
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.needsPassphrase).toBe(false);
    expect(result.current.detachedSignature).toBe(false);
  });

  it('should update private key', () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    expect(result.current.privateKey).toBe(TEST_KEYS.alice.privateKey);
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.needsPassphrase).toBe(false);
  });

  it('should update passphrase', () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPassphrase('test-passphrase');
    });

    expect(result.current.passphrase).toBe('test-passphrase');
    expect(result.current.error).toBeNull();
  });

  it('should update message', () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setMessage('Hello, World!');
    });

    expect(result.current.message).toBe('Hello, World!');
    expect(result.current.error).toBeNull();
  });

  it('should toggle detached signature mode', () => {
    const { result } = renderHook(() => useSign());

    expect(result.current.detachedSignature).toBe(false);

    act(() => {
      result.current.setDetachedSignature(true);
    });

    expect(result.current.detachedSignature).toBe(true);

    act(() => {
      result.current.setDetachedSignature(false);
    });

    expect(result.current.detachedSignature).toBe(false);
  });

  it('should reset to initial state with clearAll', () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setPassphrase('test');
      result.current.setMessage('Hello');
      result.current.setDetachedSignature(true);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.privateKey).toBe('');
    expect(result.current.passphrase).toBe('');
    expect(result.current.message).toBe('');
    expect(result.current.signedOutput).toBe('');
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.needsPassphrase).toBe(false);
    expect(result.current.detachedSignature).toBe(false);
  });
});

describe('useSign - Key Validation', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should validate valid private key format', async () => {
    const { result } = renderHook(() => useSign());

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
    const { result } = renderHook(() => useSign());

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

    const { result } = renderHook(() => useSign());

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

    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.needsPassphrase).toBe(false);
    expect(result.current.keyInfo?.isEncrypted).toBe(false);
  });
});

describe('useSign - Signing Flow', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should sign message with clear-signed format', async () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setMessage('Hello, World!');
      result.current.setDetachedSignature(false);
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.signedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
    expect(mockSign).toHaveBeenCalledTimes(1);
  });

  it('should sign message with detached signature', async () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setMessage('Hello, World!');
      result.current.setDetachedSignature(true);
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.signedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should sign with encrypted key and passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    const mockDecryptedKey = createMockKey({ isDecrypted: true });

    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);
    mockDecryptKey.mockResolvedValue(mockDecryptedKey as any);

    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.bob.privateKey);
      result.current.setPassphrase(TEST_KEYS.bob.passphrase!);
      result.current.setMessage('Hello');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.signedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
  });

  it('should fail with empty private key', async () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setMessage('Hello');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('required');
    expect(result.current.signedOutput).toBe('');
  });

  it('should fail with empty message', async () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setMessage('');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('required');
    expect(result.current.signedOutput).toBe('');
  });

  it('should handle signing errors', async () => {
    mockSign.mockImplementationOnce(() => {
      throw new Error('Signing failed');
    });

    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setMessage('Hello');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Signing failed');
    expect(result.current.signedOutput).toBe('');
  });

  it('should clear previous output on new signing', async () => {
    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
      result.current.setMessage('First message');
    });

    await act(async () => {
      await result.current.sign();
    });

    const firstOutput = result.current.signedOutput;
    expect(firstOutput).toBeTruthy();

    // Sign again
    mockSign.mockResolvedValueOnce({
      success: true,
      data: 'New signature',
    });

    act(() => {
      result.current.setMessage('Second message');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.signedOutput).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useSign - Passphrase Handling', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should detect missing passphrase for encrypted key', async () => {
    // Set up an encrypted key that will fail signing without passphrase
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    mockReadPrivateKey.mockResolvedValueOnce(mockEncryptedKey as any);

    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.bob.privateKey);
      result.current.setMessage('Hello');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('passphrase');
    expect(result.current.needsPassphrase).toBe(true);
  });

  it('should handle wrong passphrase error', async () => {
    // Set up an encrypted key and fail the decryption with wrong passphrase
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    mockReadPrivateKey.mockResolvedValueOnce(mockEncryptedKey as any);
    mockDecryptKey.mockRejectedValueOnce(new Error('Incorrect passphrase'));

    const { result } = renderHook(() => useSign());

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.bob.privateKey);
      result.current.setPassphrase('wrong');
      result.current.setMessage('Hello');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('passphrase');
  });

  it('should not require passphrase for unencrypted keys', async () => {
    const { result } = renderHook(() => useSign());

    const mockUnencryptedKey = createMockKey({ isDecrypted: true });
    mockReadPrivateKey.mockResolvedValue(mockUnencryptedKey as any);

    act(() => {
      result.current.setPrivateKey(TEST_KEYS.alice.privateKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.needsPassphrase).toBe(false);

    // Should sign without passphrase
    act(() => {
      result.current.setMessage('Hello');
    });

    await act(async () => {
      await result.current.sign();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.signedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
