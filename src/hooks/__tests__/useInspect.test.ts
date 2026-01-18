/**
 * Tests for useInspect hook
 * Target: 90%+ coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInspect } from '../useInspect';
import { TEST_KEYS } from '../../test/fixtures/keys';
import {
  mockReadKey,
  mockReadPrivateKey,
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

describe('useInspect - State Management', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useInspect());

    expect(result.current.keyText).toBe('');
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should update key text', () => {
    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    expect(result.current.keyText).toBe(TEST_KEYS.alice.publicKey);
    expect(result.current.error).toBeNull();
  });

  it('should reset to initial state with clearAll', () => {
    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.keyText).toBe('');
    expect(result.current.keyInfo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useInspect - Inspection Flow', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should inspect a valid public key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
      algorithm: 'eddsa',
      curve: 'ed25519',
    });
    mockReadKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo).toBeTruthy();
    expect(result.current.keyInfo?.type).toBe('public');
    expect(result.current.error).toBeNull();
  });

  it('should inspect a valid private key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
      isDecrypted: true,
    });
    mockReadPrivateKey.mockResolvedValue(mockKey as any);
    mockReadKey.mockRejectedValue(new Error('Not a public key'));

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.privateKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo).toBeTruthy();
    expect(result.current.keyInfo?.type).toBe('private');
    expect(result.current.error).toBeNull();
  });

  it('should detect encrypted private key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.bob.fingerprint,
      userIds: [TEST_KEYS.bob.userId],
      isDecrypted: false,
    });
    mockReadPrivateKey.mockResolvedValue(mockKey as any);
    mockReadKey.mockRejectedValue(new Error('Not a public key'));

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.bob.privateKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo).toBeTruthy();
    expect(result.current.keyInfo?.isEncrypted).toBe(true);
  });

  it('should fail with empty key', async () => {
    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText('');
    });

    await act(async () => {
      await result.current.inspect();
    });

    expect(result.current.error).toContain('paste a PGP key');
    expect(result.current.keyInfo).toBeNull();
  });

  it('should fail with whitespace-only key', async () => {
    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText('   \n  \t  ');
    });

    await act(async () => {
      await result.current.inspect();
    });

    expect(result.current.error).toContain('paste a PGP key');
  });

  it('should fail with invalid key format', async () => {
    mockReadKey.mockRejectedValue(new Error('Invalid key'));
    mockReadPrivateKey.mockRejectedValue(new Error('Invalid key'));

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText('INVALID KEY');
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain('Could not parse');
    expect(result.current.keyInfo).toBeNull();
  });

  it('should manage loading state correctly', async () => {
    const { result } = renderHook(() => useInspect());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo).toBeTruthy();
  });

  it('should clear previous keyInfo on new inspection', async () => {
    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    const firstInfo = result.current.keyInfo;
    expect(firstInfo).toBeTruthy();

    // Inspect a different key
    const mockKey2 = createMockKey({
      fingerprint: TEST_KEYS.bob.fingerprint,
      userIds: [TEST_KEYS.bob.userId],
    });
    mockReadKey.mockResolvedValueOnce(mockKey2 as any);

    act(() => {
      result.current.setKeyText(TEST_KEYS.bob.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.keyInfo).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useInspect - Detailed Info', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should extract fingerprint from key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
    });
    mockReadKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo?.fingerprint).toBe(TEST_KEYS.alice.fingerprint);
  });

  it('should extract user IDs from key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId, 'Another ID <another@example.com>'],
    });
    mockReadKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo?.userIds).toContain(TEST_KEYS.alice.userId);
    expect(result.current.keyInfo?.userIds).toHaveLength(2);
  });

  it('should extract algorithm info from key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
      algorithm: 'rsa',
      bits: 4096,
    });
    mockReadKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo?.algorithm).toBe('rsa');
    expect(result.current.keyInfo?.bitSize).toBe(4096);
  });

  it('should extract creation and expiration dates', async () => {
    const creationDate = new Date('2024-01-01');
    const expirationDate = new Date('2025-01-01');

    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
      creationTime: creationDate,
      expirationTime: expirationDate,
    });
    mockReadKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo?.created).toEqual(creationDate);
    expect(result.current.keyInfo?.expirationDate).toEqual(expirationDate);
  });

  it('should handle keys without expiration', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
      expirationTime: null,
    });
    mockReadKey.mockResolvedValue(mockKey as any);

    const { result } = renderHook(() => useInspect());

    act(() => {
      result.current.setKeyText(TEST_KEYS.alice.publicKey);
    });

    await act(async () => {
      await result.current.inspect();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.keyInfo?.expirationDate).toBeNull();
  });
});
