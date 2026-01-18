/**
 * Tests for PGP utility functions
 * Target: 95%+ coverage (critical path)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parsePublicKey,
  parsePrivateKey,
  encryptMessage,
  decryptMessage,
  signMessage,
  verifySignature,
  formatFingerprint,
  inspectKey,
  getExpiryStatus,
  getDaysUntilExpiry,
} from '../pgp';
import {
  mockReadKey,
  mockReadPrivateKey,
  mockEncrypt,
  mockDecrypt,
  mockSign,
  mockVerify,
  mockDecryptKey,
  mockCreateMessage,
  mockCreateCleartextMessage,
  mockReadMessage,
  mockReadCleartextMessage,
  createMockKey,
  setupDefaultMocks,
  resetMocks,
} from '../../test/helpers/mockOpenpgp';
import { TEST_KEYS, TEST_MESSAGES } from '../../test/fixtures/keys';
import { TEST_DATES } from '../../test/helpers/testUtils';

// Mock the openpgp module
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

describe('parsePublicKey', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should parse a valid EdDSA public key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      userIds: [TEST_KEYS.alice.userId],
      algorithm: 'eddsa',
      curve: 'ed25519',
    });

    mockReadKey.mockResolvedValue(mockKey as any);

    const result = await parsePublicKey(TEST_KEYS.alice.publicKey);

    expect(result).not.toBeNull();
    expect(result?.fingerprint).toBe(TEST_KEYS.alice.fingerprint);
    expect(result?.userIds).toContain(TEST_KEYS.alice.userId);
    expect(result?.algorithm).toBe('eddsa');
  });

  it('should parse a valid RSA public key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.rsa.fingerprint,
      userIds: [TEST_KEYS.rsa.userId],
      algorithm: 'rsa',
      bits: 2048,
    });

    mockReadKey.mockResolvedValue(mockKey as any);

    const result = await parsePublicKey(TEST_KEYS.rsa.publicKey);

    expect(result).not.toBeNull();
    expect(result?.algorithm).toBe('rsa');
  });

  it('should return null for invalid armored key', async () => {
    mockReadKey.mockRejectedValue(new Error('Invalid armor'));

    const result = await parsePublicKey('INVALID KEY');

    expect(result).toBeNull();
  });

  it('should return null for truncated key', async () => {
    mockReadKey.mockRejectedValue(new Error('Misformed armored text'));

    const result = await parsePublicKey('-----BEGIN PGP PUBLIC KEY BLOCK-----\nxjME');

    expect(result).toBeNull();
  });

  it('should detect expired keys', async () => {
    const mockKey = createMockKey({
      expirationTime: TEST_DATES.past,
    });

    mockReadKey.mockResolvedValue(mockKey as any);

    const result = await parsePublicKey(TEST_KEYS.alice.publicKey);

    expect(result).not.toBeNull();
    expect(result?.isExpired).toBe(true);
    expect(result?.expirationDate).toEqual(TEST_DATES.past);
  });

  it('should handle keys without expiration', async () => {
    const mockKey = createMockKey({
      expirationTime: null,
    });

    mockReadKey.mockResolvedValue(mockKey as any);

    const result = await parsePublicKey(TEST_KEYS.alice.publicKey);

    expect(result).not.toBeNull();
    expect(result?.isExpired).toBe(false);
    expect(result?.expirationDate).toBeNull();
  });

  it('should handle keys with future expiration', async () => {
    const mockKey = createMockKey({
      expirationTime: TEST_DATES.farFuture,
    });

    mockReadKey.mockResolvedValue(mockKey as any);

    const result = await parsePublicKey(TEST_KEYS.alice.publicKey);

    expect(result).not.toBeNull();
    expect(result?.isExpired).toBe(false);
    expect(result?.expirationDate).toEqual(TEST_DATES.farFuture);
  });

  it('should parse keys with multiple user IDs', async () => {
    const mockKey = createMockKey({
      userIds: ['Alice <alice@test.com>', 'Alice Work <alice@company.com>'],
    });

    mockReadKey.mockResolvedValue(mockKey as any);

    const result = await parsePublicKey(TEST_KEYS.alice.publicKey);

    expect(result).not.toBeNull();
    expect(result?.userIds).toHaveLength(2);
  });
});

describe('parsePrivateKey', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should parse a valid unencrypted private key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
      isDecrypted: true,
    });

    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const result = await parsePrivateKey(TEST_KEYS.alice.privateKey);

    expect(result).not.toBeNull();
    expect(result?.isEncrypted).toBe(false);
  });

  it('should parse an encrypted private key and mark it as encrypted', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.bob.fingerprint,
      isDecrypted: false,
    });

    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const result = await parsePrivateKey(TEST_KEYS.bob.privateKey);

    expect(result).not.toBeNull();
    expect(result?.isEncrypted).toBe(true);
  });

  it('should return null for invalid private key', async () => {
    mockReadPrivateKey.mockRejectedValue(new Error('Invalid key'));

    const result = await parsePrivateKey('INVALID PRIVATE KEY');

    expect(result).toBeNull();
  });

  it('should return null for malformed private key', async () => {
    mockReadPrivateKey.mockRejectedValue(new Error('Malformed'));

    const result = await parsePrivateKey('-----BEGIN PGP PRIVATE KEY BLOCK-----\ntruncated');

    expect(result).toBeNull();
  });

  it('should detect expired private keys', async () => {
    const mockKey = createMockKey({
      expirationTime: TEST_DATES.yesterday,
    });

    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const result = await parsePrivateKey(TEST_KEYS.alice.privateKey);

    expect(result).not.toBeNull();
    expect(result?.isExpired).toBe(true);
  });

  it('should handle private keys without expiration', async () => {
    const mockKey = createMockKey({
      expirationTime: null,
    });

    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const result = await parsePrivateKey(TEST_KEYS.alice.privateKey);

    expect(result).not.toBeNull();
    expect(result?.expirationDate).toBeNull();
  });

  it('should parse multiple user IDs', async () => {
    const mockKey = createMockKey({
      userIds: ['Bob <bob@test.com>', 'Bob Personal <bob@personal.com>'],
    });

    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const result = await parsePrivateKey(TEST_KEYS.bob.privateKey);

    expect(result).not.toBeNull();
    expect(result?.userIds).toHaveLength(2);
  });

  it('should detect algorithm correctly', async () => {
    const mockKey = createMockKey({
      algorithm: 'rsa',
      bits: 4096,
    });

    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const result = await parsePrivateKey(TEST_KEYS.rsa.privateKey);

    expect(result).not.toBeNull();
    expect(result?.algorithm).toBe('rsa');
  });
});

describe('encryptMessage', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should encrypt a message with a single recipient', async () => {
    const result = await encryptMessage(TEST_MESSAGES.plaintext, TEST_KEYS.alice.publicKey);

    expect(result.success).toBe(true);
    expect(result.data).toContain('-----BEGIN PGP MESSAGE-----');
    expect(result.error).toBeUndefined();
    expect(mockEncrypt).toHaveBeenCalledTimes(1);
  });

  it('should encrypt a message with multiple recipients (2)', async () => {
    const result = await encryptMessage(TEST_MESSAGES.plaintext, [
      TEST_KEYS.alice.publicKey,
      TEST_KEYS.bob.publicKey,
    ]);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(mockReadKey).toHaveBeenCalledTimes(2);
  });

  it('should encrypt a message with multiple recipients (10 max)', async () => {
    const keys = Array(10).fill(TEST_KEYS.alice.publicKey);

    const result = await encryptMessage(TEST_MESSAGES.plaintext, keys);

    expect(result.success).toBe(true);
    expect(mockReadKey).toHaveBeenCalledTimes(10);
  });

  it('should fail with empty keys array', async () => {
    const result = await encryptMessage(TEST_MESSAGES.plaintext, []);

    expect(result.success).toBe(false);
    expect(result.error).toContain('At least one public key is required');
  });

  it('should handle invalid key format', async () => {
    mockReadKey.mockRejectedValue(new Error('Invalid key format'));

    const result = await encryptMessage(TEST_MESSAGES.plaintext, 'INVALID KEY');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle OpenPGP.js encryption errors', async () => {
    mockEncrypt.mockRejectedValue(new Error('Encryption error'));

    const result = await encryptMessage(TEST_MESSAGES.plaintext, TEST_KEYS.alice.publicKey);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Encryption error');
  });

  it('should encrypt large messages near 1MB', async () => {
    const largeMessage = 'x'.repeat(1024 * 512); // 512KB

    const result = await encryptMessage(largeMessage, TEST_KEYS.alice.publicKey);

    expect(result.success).toBe(true);
  });

  it('should handle empty message', async () => {
    const result = await encryptMessage('', TEST_KEYS.alice.publicKey);

    expect(result.success).toBe(true);
  });

  it('should handle unicode and special characters', async () => {
    const unicodeMessage = 'Hello 世界 🌍';

    const result = await encryptMessage(unicodeMessage, TEST_KEYS.alice.publicKey);

    expect(result.success).toBe(true);
  });

  it('should handle emoji in messages', async () => {
    const emojiMessage = '🔐 Encrypted 🎉 message 🚀';

    const result = await encryptMessage(emojiMessage, TEST_KEYS.alice.publicKey);

    expect(result.success).toBe(true);
  });
});

describe('decryptMessage', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should decrypt a message with an unencrypted private key', async () => {
    const result = await decryptMessage(
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.alice.privateKey
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should decrypt a message with an encrypted key and correct passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    const mockDecryptedKey = createMockKey({ isDecrypted: true });

    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);
    mockDecryptKey.mockResolvedValue(mockDecryptedKey as any);

    const result = await decryptMessage(
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.bob.privateKey,
      TEST_KEYS.bob.passphrase
    );

    expect(result.success).toBe(true);
    expect(mockDecryptKey).toHaveBeenCalledWith({
      privateKey: mockEncryptedKey,
      passphrase: TEST_KEYS.bob.passphrase,
    });
  });

  it('should fail when encrypted key used without passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);

    const result = await decryptMessage(
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.bob.privateKey
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('passphrase');
  });

  it('should fail with wrong passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);
    mockDecryptKey.mockRejectedValue(new Error('Incorrect passphrase'));

    const result = await decryptMessage(
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.bob.privateKey,
      'wrong-passphrase'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Incorrect passphrase');
  });

  it('should fail with invalid encrypted message', async () => {
    mockReadMessage.mockRejectedValue(new Error('Invalid message'));

    const result = await decryptMessage('INVALID MESSAGE', TEST_KEYS.alice.privateKey);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should fail with wrong private key', async () => {
    mockDecrypt.mockRejectedValue(new Error('Session key decryption failed'));

    const result = await decryptMessage(
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.bob.privateKey
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('correct private key');
  });

  it('should handle malformed message format', async () => {
    mockReadMessage.mockRejectedValue(new Error('Malformed armor'));

    const result = await decryptMessage('MALFORMED', TEST_KEYS.alice.privateKey);

    expect(result.success).toBe(false);
  });

  it('should decrypt large messages', async () => {
    mockDecrypt.mockResolvedValue({ data: 'x'.repeat(1024 * 512) });

    const result = await decryptMessage('LARGE ENCRYPTED', TEST_KEYS.alice.privateKey);

    expect(result.success).toBe(true);
    expect(result.data?.length).toBeGreaterThan(500000);
  });

  it('should handle unicode in decrypted content', async () => {
    mockDecrypt.mockResolvedValue({ data: 'Decrypted: 世界 🌍' });

    const result = await decryptMessage(
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.alice.privateKey
    );

    expect(result.success).toBe(true);
    expect(result.data).toContain('世界');
  });

  it('should provide user-friendly error for session key failure', async () => {
    mockDecrypt.mockRejectedValue(new Error('Session key decryption failed'));

    const result = await decryptMessage(
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.charlie.privateKey
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('correct private key');
  });
});

describe('signMessage', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should create a clear-signed message', async () => {
    const result = await signMessage(
      TEST_MESSAGES.plaintext,
      TEST_KEYS.alice.privateKey,
      undefined,
      false
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(mockCreateCleartextMessage).toHaveBeenCalled();
  });

  it('should create a detached signature', async () => {
    const result = await signMessage(
      TEST_MESSAGES.plaintext,
      TEST_KEYS.alice.privateKey,
      undefined,
      true
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(mockCreateMessage).toHaveBeenCalled();
  });

  it('should sign with encrypted key and correct passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    const mockDecryptedKey = createMockKey({ isDecrypted: true });

    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);
    mockDecryptKey.mockResolvedValue(mockDecryptedKey as any);

    const result = await signMessage(
      TEST_MESSAGES.plaintext,
      TEST_KEYS.bob.privateKey,
      TEST_KEYS.bob.passphrase
    );

    expect(result.success).toBe(true);
    expect(mockDecryptKey).toHaveBeenCalled();
  });

  it('should fail when encrypted key used without passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);

    const result = await signMessage(TEST_MESSAGES.plaintext, TEST_KEYS.bob.privateKey);

    expect(result.success).toBe(false);
    expect(result.error).toContain('passphrase');
  });

  it('should fail with wrong passphrase', async () => {
    const mockEncryptedKey = createMockKey({ isDecrypted: false });
    mockReadPrivateKey.mockResolvedValue(mockEncryptedKey as any);
    mockDecryptKey.mockRejectedValue(new Error('Incorrect passphrase'));

    const result = await signMessage(
      TEST_MESSAGES.plaintext,
      TEST_KEYS.bob.privateKey,
      'wrong-pass'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Incorrect passphrase');
  });

  it('should handle empty message', async () => {
    const result = await signMessage('', TEST_KEYS.alice.privateKey);

    expect(result.success).toBe(true);
  });

  it('should sign large messages', async () => {
    const largeMessage = 'x'.repeat(1024 * 512);

    const result = await signMessage(largeMessage, TEST_KEYS.alice.privateKey);

    expect(result.success).toBe(true);
  });

  it('should handle unicode messages', async () => {
    const unicodeMessage = 'Sign this: 世界 🌍';

    const result = await signMessage(unicodeMessage, TEST_KEYS.alice.privateKey);

    expect(result.success).toBe(true);
  });

  it('should handle OpenPGP signing errors', async () => {
    mockSign.mockRejectedValue(new Error('Signing failed'));

    const result = await signMessage(TEST_MESSAGES.plaintext, TEST_KEYS.alice.privateKey);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Signing failed');
  });
});

describe('verifySignature', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should verify a valid clear-signed message', async () => {
    const result = await verifySignature(
      TEST_MESSAGES.signedByAlice,
      TEST_KEYS.alice.publicKey
    );

    expect(result.success).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.signedBy).toBeDefined();
  });

  it('should verify a valid detached signature', async () => {
    mockReadCleartextMessage.mockRejectedValue(new Error('Not cleartext'));

    const result = await verifySignature(
      TEST_MESSAGES.detachedSignature,
      TEST_KEYS.alice.publicKey
    );

    expect(result.success).toBe(true);
    expect(mockReadMessage).toHaveBeenCalled();
  });

  it('should detect invalid signatures', async () => {
    mockVerify.mockResolvedValue({
      signatures: [
        {
          verified: Promise.reject(new Error('Invalid')),
          signature: Promise.resolve({ packets: [{ created: new Date() }] }),
        },
      ],
      data: 'Original message',
    } as any);

    const result = await verifySignature(
      TEST_MESSAGES.signedByAlice,
      TEST_KEYS.alice.publicKey
    );

    expect(result.success).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tampered');
  });

  it('should fail with wrong public key', async () => {
    mockReadKey.mockRejectedValue(new Error('Invalid key'));

    const result = await verifySignature(TEST_MESSAGES.signedByAlice, 'INVALID KEY');

    expect(result.success).toBe(false);
  });

  it('should fail with malformed signature', async () => {
    mockReadCleartextMessage.mockRejectedValue(new Error('Not cleartext'));
    mockReadMessage.mockRejectedValue(new Error('Invalid'));

    const result = await verifySignature('INVALID SIGNATURE', TEST_KEYS.alice.publicKey);

    expect(result.success).toBe(false);
  });

  it('should extract signature timestamp', async () => {
    const signDate = new Date('2024-01-01');
    mockVerify.mockResolvedValue({
      signatures: [
        {
          verified: Promise.resolve(true),
          signature: Promise.resolve({ packets: [{ created: signDate }] }),
        },
      ],
      data: 'Message',
    } as any);

    const result = await verifySignature(
      TEST_MESSAGES.signedByAlice,
      TEST_KEYS.alice.publicKey
    );

    expect(result.success).toBe(true);
    expect(result.signedAt).toEqual(signDate);
  });
});

describe('formatFingerprint', () => {
  it('should format fingerprint into groups of 4', () => {
    const fingerprint = '0123456789ABCDEF0123456789ABCDEF01234567';
    const result = formatFingerprint(fingerprint);

    expect(result).toBe('0123 4567 89AB CDEF 0123 4567 89AB CDEF 0123 4567');
  });

  it('should handle odd-length fingerprints', () => {
    const fingerprint = '012345';
    const result = formatFingerprint(fingerprint);

    expect(result).toBe('0123 45');
  });

  it('should handle empty fingerprint', () => {
    const result = formatFingerprint('');

    expect(result).toBe('');
  });

  it('should handle fingerprint shorter than 4 characters', () => {
    const result = formatFingerprint('AB');

    expect(result).toBe('AB');
  });
});

describe('getExpiryStatus', () => {
  it('should return no-expiry for null expiration', () => {
    expect(getExpiryStatus(null)).toBe('no-expiry');
  });

  it('should return valid for expiration 30+ days away', () => {
    expect(getExpiryStatus(TEST_DATES.in90Days)).toBe('valid');
  });

  it('should return expiring-soon for 8-30 days', () => {
    expect(getExpiryStatus(TEST_DATES.in10Days)).toBe('expiring-soon');
  });

  it('should return expiring-week for 1-7 days', () => {
    expect(getExpiryStatus(TEST_DATES.in7Days)).toBe('expiring-week');
    expect(getExpiryStatus(TEST_DATES.in3Days)).toBe('expiring-week');
  });

  it('should return expired for past dates', () => {
    expect(getExpiryStatus(TEST_DATES.past)).toBe('expired');
    expect(getExpiryStatus(TEST_DATES.yesterday)).toBe('expired');
  });

  it('should handle boundary at 7 days', () => {
    const exactly7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(getExpiryStatus(exactly7Days)).toBe('expiring-week');
  });

  it('should handle boundary at 30 days', () => {
    const exactly30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(getExpiryStatus(exactly30Days)).toBe('expiring-soon');
  });
});

describe('getDaysUntilExpiry', () => {
  it('should return null for no expiration', () => {
    expect(getDaysUntilExpiry(null)).toBeNull();
  });

  it('should return positive days for future dates', () => {
    const result = getDaysUntilExpiry(TEST_DATES.in90Days);

    expect(result).toBeGreaterThan(80);
    expect(result).toBeLessThan(100);
  });

  it('should return negative days for expired keys', () => {
    const result = getDaysUntilExpiry(TEST_DATES.past);

    expect(result).toBeLessThan(0);
  });

  it('should return 0 or 1 for dates within 24 hours', () => {
    const tomorrow = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const result = getDaysUntilExpiry(tomorrow);

    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('should round up days (ceiling)', () => {
    // 1.5 days should round to 2
    const oneDayHalf = new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000);
    const result = getDaysUntilExpiry(oneDayHalf);

    expect(result).toBe(2);
  });
});

describe('inspectKey', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  afterEach(() => {
    resetMocks();
  });

  it('should inspect a public key', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.alice.fingerprint,
    });

    // Mock additional methods needed for inspectKey
    (mockKey as any).getKeyID = () => ({ toHex: () => TEST_KEYS.alice.keyId });
    (mockKey as any).getSubkeys = () => [];
    (mockKey as any).getSigningKey = vi.fn().mockResolvedValue(mockKey);
    (mockKey as any).getEncryptionKey = vi.fn().mockResolvedValue(mockKey);

    mockReadKey.mockResolvedValue(mockKey as any);

    const result = await inspectKey(TEST_KEYS.alice.publicKey);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('public');
    expect(result?.fingerprint).toBe(TEST_KEYS.alice.fingerprint);
    expect(result?.capabilities.certify).toBe(true);
  });

  it('should inspect a private key and detect encryption status', async () => {
    const mockKey = createMockKey({
      fingerprint: TEST_KEYS.bob.fingerprint,
      isDecrypted: false,
    });

    (mockKey as any).getKeyID = () => ({ toHex: () => TEST_KEYS.bob.keyId });
    (mockKey as any).getSubkeys = () => [];
    (mockKey as any).getSigningKey = vi.fn().mockResolvedValue(mockKey);
    (mockKey as any).getEncryptionKey = vi.fn().mockResolvedValue(mockKey);

    mockReadPrivateKey.mockResolvedValue(mockKey as any);

    const result = await inspectKey(TEST_KEYS.bob.privateKey);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('private');
    expect(result?.isEncrypted).toBe(true);
  });

  it('should return null for invalid key', async () => {
    mockReadKey.mockRejectedValue(new Error('Invalid'));
    mockReadPrivateKey.mockRejectedValue(new Error('Invalid'));

    const result = await inspectKey('INVALID KEY');

    expect(result).toBeNull();
  });
});
