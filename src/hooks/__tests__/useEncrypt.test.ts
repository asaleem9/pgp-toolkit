/**
 * Tests for useEncrypt hook
 * Target: 95%+ coverage (critical path)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEncrypt } from '../useEncrypt';
import { TEST_KEYS, TEST_MESSAGES } from '../../test/fixtures/keys';
import {
  mockReadKey,
  mockEncrypt,
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

describe('useEncrypt - State Management', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should initialize with one empty recipient', () => {
    const { result } = renderHook(() => useEncrypt());

    expect(result.current.recipients).toHaveLength(1);
    expect(result.current.recipients[0].key).toBe('');
    expect(result.current.recipients[0].keyInfo).toBeNull();
    expect(result.current.recipients[0].error).toBeNull();
    expect(result.current.message).toBe('');
    expect(result.current.encryptedOutput).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should update first recipient key with setPublicKey', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    expect(result.current.recipients[0].key).toBe(TEST_KEYS.alice.publicKey);
    expect(result.current.publicKey).toBe(TEST_KEYS.alice.publicKey);
  });

  it('should update message', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    expect(result.current.message).toBe(TEST_MESSAGES.plaintext);
    expect(result.current.error).toBeNull();
  });

  it('should reset to initial state with clearAll', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
      result.current.addRecipient();
    });

    expect(result.current.recipients).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.recipients).toHaveLength(1);
    expect(result.current.recipients[0].key).toBe('');
    expect(result.current.message).toBe('');
    expect(result.current.encryptedOutput).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('should toggle encryptToSelf', () => {
    const { result } = renderHook(() => useEncrypt());

    expect(result.current.encryptToSelf).toBe(false);

    act(() => {
      result.current.setEncryptToSelf(true);
    });

    expect(result.current.encryptToSelf).toBe(true);
    expect(result.current.selfKeyError).toBeNull();
  });

  it('should update self key', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setSelfKey(TEST_KEYS.alice.publicKey);
    });

    expect(result.current.selfKey).toBe(TEST_KEYS.alice.publicKey);
    expect(result.current.selfKeyInfo).toBeNull();
    expect(result.current.selfKeyError).toBeNull();
  });

  it('should clear error when updating keys', () => {
    const { result } = renderHook(() => useEncrypt());

    // Set an error
    act(() => {
      result.current.setPublicKey('');
    });

    act(() => {
      void result.current.encrypt();
    });

    // Error should be set
    expect(result.current.error).toBeTruthy();

    // Update key should clear error
    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    expect(result.current.error).toBeNull();
  });

  it('should maintain state across multiple updates', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
      result.current.setEncryptToSelf(true);
      result.current.setSelfKey(TEST_KEYS.bob.publicKey);
    });

    expect(result.current.publicKey).toBe(TEST_KEYS.alice.publicKey);
    expect(result.current.message).toBe(TEST_MESSAGES.plaintext);
    expect(result.current.encryptToSelf).toBe(true);
    expect(result.current.selfKey).toBe(TEST_KEYS.bob.publicKey);
  });
});

describe('useEncrypt - Recipient Management', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should add a new recipient', () => {
    const { result } = renderHook(() => useEncrypt());

    expect(result.current.recipients).toHaveLength(1);

    act(() => {
      result.current.addRecipient();
    });

    expect(result.current.recipients).toHaveLength(2);
    expect(result.current.recipients[1].key).toBe('');
    expect(result.current.recipients[1].id).toBeDefined();
  });

  it('should not exceed 10 recipients', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      // Add 9 more recipients (already have 1)
      for (let i = 0; i < 10; i++) {
        result.current.addRecipient();
      }
    });

    expect(result.current.recipients).toHaveLength(10);

    // Try to add 11th recipient
    act(() => {
      result.current.addRecipient();
    });

    expect(result.current.recipients).toHaveLength(10); // Still 10
  });

  it('should remove a recipient by id', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.addRecipient();
      result.current.addRecipient();
    });

    expect(result.current.recipients).toHaveLength(3);

    const idToRemove = result.current.recipients[1].id;

    act(() => {
      result.current.removeRecipient(idToRemove);
    });

    expect(result.current.recipients).toHaveLength(2);
    expect(result.current.recipients.find(r => r.id === idToRemove)).toBeUndefined();
  });

  it('should not remove last recipient', () => {
    const { result } = renderHook(() => useEncrypt());

    expect(result.current.recipients).toHaveLength(1);

    const lastId = result.current.recipients[0].id;

    act(() => {
      result.current.removeRecipient(lastId);
    });

    expect(result.current.recipients).toHaveLength(1); // Still 1
  });

  it('should update specific recipient key', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.addRecipient();
    });

    const secondId = result.current.recipients[1].id;

    act(() => {
      result.current.updateRecipient(secondId, TEST_KEYS.bob.publicKey);
    });

    expect(result.current.recipients[0].key).toBe('');
    expect(result.current.recipients[1].key).toBe(TEST_KEYS.bob.publicKey);
    expect(result.current.recipients[1].keyInfo).toBeNull();
    expect(result.current.recipients[1].error).toBeNull();
  });

  it('should generate unique IDs for recipients', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.addRecipient();
      result.current.addRecipient();
      result.current.addRecipient();
    });

    const ids = result.current.recipients.map(r => r.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should clear recipient error when updating key', () => {
    const { result } = renderHook(() => useEncrypt());

    const recipientId = result.current.recipients[0].id;

    act(() => {
      result.current.updateRecipient(recipientId, 'INVALID KEY');
    });

    act(() => {
      void result.current.validateRecipient(recipientId);
    });

    // Should have error
    expect(result.current.recipients[0].error).toBeTruthy();

    // Update key should clear error
    act(() => {
      result.current.updateRecipient(recipientId, TEST_KEYS.alice.publicKey);
    });

    expect(result.current.recipients[0].error).toBeNull();
  });

  it('should handle recipient not found in updateRecipient', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.updateRecipient('nonexistent-id', TEST_KEYS.alice.publicKey);
    });

    // Should not crash, recipients unchanged
    expect(result.current.recipients).toHaveLength(1);
    expect(result.current.recipients[0].key).toBe('');
  });
});

describe('useEncrypt - Validation', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should validate recipient key format', async () => {
    const { result } = renderHook(() => useEncrypt());

    const recipientId = result.current.recipients[0].id;

    act(() => {
      result.current.updateRecipient(recipientId, TEST_KEYS.alice.publicKey);
    });

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateRecipient(recipientId);
    });

    expect(isValid).toBe(true);
    expect(result.current.recipients[0].error).toBeNull();
    expect(result.current.recipients[0].keyInfo).toBeTruthy();
  });

  it('should detect invalid key format', async () => {
    const { result } = renderHook(() => useEncrypt());

    const recipientId = result.current.recipients[0].id;

    act(() => {
      result.current.updateRecipient(recipientId, 'INVALID KEY');
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateRecipient(recipientId);
    });

    expect(isValid).toBe(false);
    expect(result.current.recipients[0].error).toContain('valid PGP public key');
  });

  it('should validate self key when encryptToSelf enabled', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setEncryptToSelf(true);
      result.current.setSelfKey(TEST_KEYS.alice.publicKey);
    });

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateSelfKey();
    });

    expect(isValid).toBe(true);
    expect(result.current.selfKeyError).toBeNull();
    expect(result.current.selfKeyInfo).toBeTruthy();
  });

  it('should require self key when encryptToSelf enabled', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setEncryptToSelf(true);
      result.current.setSelfKey('');
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateSelfKey();
    });

    expect(isValid).toBe(false);
    expect(result.current.selfKeyError).toContain('required');
  });

  it('should validate self key format', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setSelfKey('INVALID KEY');
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateSelfKey();
    });

    expect(isValid).toBe(false);
    expect(result.current.selfKeyError).toBeTruthy();
  });

  it('should use backwards compatible validateKey', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateKey();
    });

    expect(isValid).toBe(true);
    expect(result.current.keyInfo).toBeTruthy();
  });
});

describe('useEncrypt - Encryption Flow', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should encrypt message with single recipient', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.encryptedOutput).toBeDefined();
    expect(result.current.encryptedOutput).toContain('-----BEGIN PGP MESSAGE-----');
    expect(result.current.error).toBeNull();
    expect(mockEncrypt).toHaveBeenCalledTimes(1);
  });

  it('should encrypt with multiple recipients', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.addRecipient();
    });

    const secondId = result.current.recipients[1].id;

    act(() => {
      result.current.updateRecipient(secondId, TEST_KEYS.bob.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.encryptedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
    expect(mockEncrypt).toHaveBeenCalledWith(
      expect.objectContaining({
        encryptionKeys: expect.any(Array),
      })
    );
  });

  it('should include self key when encryptToSelf enabled', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
      result.current.setEncryptToSelf(true);
      result.current.setSelfKey(TEST_KEYS.bob.publicKey);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.encryptedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
    // Should be called with 2 keys (alice + bob as self)
    expect(mockReadKey).toHaveBeenCalledTimes(2);
  });

  it('should fail without any keys', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('At least one public key is required');
    expect(result.current.encryptedOutput).toBe('');
  });

  it('should fail with invalid key format', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey('INVALID KEY');
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('invalid');
    expect(result.current.encryptedOutput).toBe('');
  });

  it('should fail without message', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage('');
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('required');
    expect(result.current.encryptedOutput).toBe('');
  });

  it('should fail when self key required but missing', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
      result.current.setEncryptToSelf(true);
      result.current.setSelfKey('');
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.selfKeyError).toContain('required');
    expect(result.current.encryptedOutput).toBe('');
  });

  it('should handle encryption errors', async () => {
    mockEncrypt.mockRejectedValue(new Error('Encryption failed'));

    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.encryptedOutput).toBe('');
  });

  it('should manage loading state correctly', async () => {
    const { result } = renderHook(() => useEncrypt());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.encryptedOutput).toBeTruthy();
  });

  it('should clear previous output on new encryption', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    const firstOutput = result.current.encryptedOutput;
    expect(firstOutput).toBeTruthy();

    // Encrypt again with new message
    act(() => {
      result.current.setMessage('New message content');
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.encryptedOutput).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useEncrypt - Backwards Compatibility', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should provide publicKey accessor for first recipient', () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    expect(result.current.publicKey).toBe(TEST_KEYS.alice.publicKey);
    expect(result.current.publicKey).toBe(result.current.recipients[0].key);
  });

  it('should provide keyInfo accessor for first recipient', async () => {
    const { result } = renderHook(() => useEncrypt());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.keyInfo).toBeTruthy();
    expect(result.current.keyInfo).toBe(result.current.recipients[0].keyInfo);
  });

  it('should work with single recipient (backwards compatible mode)', async () => {
    const { result } = renderHook(() => useEncrypt());

    // Use only backwards compatible API
    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setMessage(TEST_MESSAGES.plaintext);
    });

    await act(async () => {
      const isValid = await result.current.validateKey();
      expect(isValid).toBe(true);
    });

    await act(async () => {
      await result.current.encrypt();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.encryptedOutput).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
