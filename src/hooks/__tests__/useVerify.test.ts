/**
 * Tests for useVerify hook
 * Target: 90%+ coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useVerify } from '../useVerify';
import { TEST_KEYS, TEST_MESSAGES } from '../../test/fixtures/keys';
import {
  mockReadKey,
  mockVerify,
  mockReadCleartextMessage,
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

describe('useVerify - State Management', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useVerify());

    expect(result.current.publicKey).toBe('');
    expect(result.current.signedMessage).toBe('');
    expect(result.current.result).toBeNull();
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should update public key', () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    expect(result.current.publicKey).toBe(TEST_KEYS.alice.publicKey);
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should update signed message', () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    expect(result.current.signedMessage).toBe(TEST_MESSAGES.signedByAlice);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should reset to initial state with clearAll', () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.publicKey).toBe('');
    expect(result.current.signedMessage).toBe('');
    expect(result.current.result).toBeNull();
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useVerify - Key Validation', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should validate valid public key format', async () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateKey();
    });

    expect(isValid).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.keyInfo).toBeTruthy();
  });

  it('should detect invalid public key format', async () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey('INVALID KEY');
    });

    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateKey();
    });

    expect(isValid).toBe(false);
    expect(result.current.error).toContain('valid PGP public key');
    expect(result.current.keyInfo).toBeNull();
  });

  it('should update keyInfo on successful validation', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
    });
    mockReadKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.validateKey();
    });

    expect(result.current.keyInfo).toBeTruthy();
    expect(result.current.keyInfo?.fingerprint).toBe(TEST_KEYS.alice.fingerprint);
  });
});

describe('useVerify - Verification Flow', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should verify a valid clear-signed message', async () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).toBeTruthy();
    expect(result.current.result?.success).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should verify a detached signature', async () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage('Message with detached signature');
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).toBeTruthy();
    expect(result.current.result?.success).toBe(true);
  });

  it('should fail with empty public key', async () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('required');
    expect(result.current.result).toBeNull();
  });

  it('should fail with empty signed message', async () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage('');
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('required');
    expect(result.current.result).toBeNull();
  });

  it('should detect invalid signature', async () => {
    mockVerify.mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });

    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage('Invalid signature');
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.result).toBeNull();
  });

  it('should detect wrong public key for signature', async () => {
    // Mock verified promise to reject (invalid signature)
    mockVerify.mockResolvedValueOnce({
      signatures: [{
        keyID: { toHex: () => '0123456789ABCDEF' },
        verified: Promise.reject(new Error('Invalid signature')),
        signature: {
          packets: [{ created: new Date() }],
        },
      }],
      data: 'Original message',
    } as any);

    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.bob.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).toBeTruthy();
    expect(result.current.result?.valid).toBe(false);
  });

  it('should handle malformed signed message', async () => {
    // Make verify itself throw an error
    mockVerify.mockImplementationOnce(() => {
      throw new Error('Malformed message');
    });

    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage('MALFORMED');
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should manage loading state correctly', async () => {
    const { result } = renderHook(() => useVerify());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result).toBeTruthy();
  });
});

describe('useVerify - Result Parsing', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should extract signedBy from verification result', async () => {
    mockVerify.mockResolvedValueOnce({
      signatures: [{
        keyID: { toHex: () => TEST_KEYS.alice.fingerprint.slice(-16) },
        verified: Promise.resolve(true),
        signature: {
          packets: [{ created: new Date('2024-01-01') }],
        },
      }],
      data: 'Original message',
    } as any);

    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result?.signedBy).toBeTruthy();
  });

  it('should extract signedAt timestamp from verification result', async () => {
    const signDate = new Date('2024-01-15T10:30:00Z');
    mockVerify.mockResolvedValueOnce({
      signatures: [{
        keyID: { toHex: () => '0123456789ABCDEF' },
        verified: Promise.resolve(true),
        signature: {
          packets: [{ created: signDate }],
        },
      }],
      data: 'Original message',
    } as any);

    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result?.signedAt).toBe(signDate);
  });

  it('should extract original message from verification result', async () => {
    const originalMessage = 'This is the original message';
    mockVerify.mockResolvedValueOnce({
      signatures: [{
        keyID: { toHex: () => '0123456789ABCDEF' },
        verified: Promise.resolve(true),
        signature: {
          packets: [{ created: new Date() }],
        },
      }],
      data: originalMessage,
    } as any);

    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.result?.message).toBe(originalMessage);
  });

  it('should clear previous result on new verification', async () => {
    const { result } = renderHook(() => useVerify());

    act(() => {
      result.current.setPublicKey(TEST_KEYS.alice.publicKey);
      result.current.setSignedMessage(TEST_MESSAGES.signedByAlice);
    });

    await act(async () => {
      await result.current.verify();
    });

    const firstResult = result.current.result;
    expect(firstResult).toBeTruthy();

    // Verify again with different result
    mockVerify.mockResolvedValueOnce({
      signatures: [{
        keyID: { toHex: () => 'DIFFERENT' },
        verified: Promise.resolve(true),
        signature: {
          packets: [{ created: new Date() }],
        },
      }],
      data: 'Different message',
    } as any);

    act(() => {
      result.current.setSignedMessage('New signed message');
    });

    await act(async () => {
      await result.current.verify();
    });

    await waitFor(() => {
      expect(result.current.result).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
