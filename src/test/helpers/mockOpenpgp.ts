/**
 * Mock OpenPGP.js library for testing
 * Provides controlled mock implementations of all OpenPGP operations
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

/**
 * Mock key object structure matching OpenPGP.js Key interface
 */
export interface MockKey {
  getFingerprint: () => string;
  getUserIDs: () => string[];
  getAlgorithmInfo: () => { algorithm: string; bits?: number; curve?: string };
  getCreationTime: () => Date;
  getExpirationTime: () => Date | null | Promise<Date | null>;
  isDecrypted: () => boolean;
  armor: () => string;
  getKeyID: () => { toHex: () => string };
  getSubkeys: () => any[];
  getSigningKey: () => Promise<any>;
  getEncryptionKey: () => Promise<any>;
}

/**
 * Mock message object structure
 */
export interface MockMessage {
  getText: () => Promise<string>;
  armor: () => string;
}

/**
 * Mock signature object structure
 */
export interface MockSignature {
  verified: Promise<{ keyID: any; valid: boolean }>;
}

/**
 * Factory to create mock key objects
 */
export function createMockKey(options: {
  fingerprint?: string;
  userIds?: string[];
  algorithm?: string;
  bits?: number;
  curve?: string;
  creationTime?: Date;
  expirationTime?: Date | null;
  isDecrypted?: boolean;
  armor?: string;
}): MockKey {
  const {
    fingerprint = '0123456789ABCDEF0123456789ABCDEF01234567',
    userIds = ['Test User <test@example.com>'],
    algorithm = 'eddsa',
    bits,
    curve = 'ed25519',
    creationTime = new Date('2024-01-01'),
    expirationTime = null,
    isDecrypted = true,
    armor = '-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----',
  } = options;

  const keyId = fingerprint.slice(-16);

  return {
    getFingerprint: () => fingerprint,
    getUserIDs: () => userIds,
    getAlgorithmInfo: () => ({
      algorithm,
      ...(bits ? { bits } : {}),
      ...(curve ? { curve } : {}),
    }),
    getCreationTime: () => creationTime,
    getExpirationTime: () => expirationTime,
    isDecrypted: () => isDecrypted,
    armor: () => armor,
    getKeyID: () => ({ toHex: () => keyId }),
    getSubkeys: () => [],
    getSigningKey: () => Promise.resolve({}),
    getEncryptionKey: () => Promise.resolve({}),
  };
}

/**
 * Factory to create mock message objects
 */
export function createMockMessage(text: string, armoredText?: string): MockMessage {
  return {
    getText: () => Promise.resolve(text),
    armor: () => armoredText || `-----BEGIN PGP MESSAGE-----\n...\n-----END PGP MESSAGE-----`,
  };
}

/**
 * Mock OpenPGP.js functions
 */
export const mockReadKey = vi.fn() as Mock<any[], Promise<MockKey>>;
export const mockReadPrivateKey = vi.fn() as Mock<any[], Promise<MockKey>>;
export const mockEncrypt = vi.fn() as Mock<any[], Promise<string>>;
export const mockDecrypt = vi.fn() as Mock<any[], Promise<{ data: string }>>;
export const mockSign = vi.fn() as Mock<any[], Promise<string>>;
export const mockVerify = vi.fn() as Mock<any[], Promise<any>>;
export const mockCreateMessage = vi.fn() as Mock<any[], Promise<any>>;
export const mockCreateCleartextMessage = vi.fn() as Mock<any[], Promise<any>>;
export const mockReadMessage = vi.fn() as Mock<any[], Promise<any>>;
export const mockReadCleartextMessage = vi.fn() as Mock<any[], Promise<any>>;
export const mockDecryptKey = vi.fn() as Mock<any[], Promise<MockKey>>;

/**
 * Setup default successful mock behaviors
 */
export function setupDefaultMocks() {
  // Default successful key parsing
  mockReadKey.mockImplementation(async ({ armoredKey }) => {
    if (armoredKey.includes('INVALID') || !armoredKey.includes('PUBLIC KEY')) {
      throw new Error('Error reading key');
    }
    return createMockKey({});
  });

  mockReadPrivateKey.mockImplementation(async ({ armoredKey }) => {
    if (armoredKey.includes('INVALID') || !armoredKey.includes('PRIVATE KEY')) {
      throw new Error('Error reading private key');
    }
    const isEncrypted = armoredKey.includes('ENCRYPTED');
    return createMockKey({ isDecrypted: !isEncrypted });
  });

  // Default successful encryption
  mockEncrypt.mockImplementation(async ({ message, encryptionKeys }) => {
    if (!encryptionKeys || encryptionKeys.length === 0) {
      throw new Error('No encryption keys provided');
    }
    return '-----BEGIN PGP MESSAGE-----\nencrypted content\n-----END PGP MESSAGE-----';
  });

  // Default successful decryption
  mockDecrypt.mockImplementation(async ({ message, decryptionKeys }) => {
    if (!decryptionKeys) {
      throw new Error('No decryption key provided');
    }
    const key = Array.isArray(decryptionKeys) ? decryptionKeys[0] : decryptionKeys;
    if (!key.isDecrypted()) {
      throw new Error('Error decrypting message: Session key decryption failed.');
    }
    return { data: 'Decrypted message content' };
  });

  // Default successful signing
  mockSign.mockImplementation(async ({ message, signingKeys, format, detached }) => {
    if (!signingKeys) {
      throw new Error('No signing key provided');
    }
    const key = Array.isArray(signingKeys) ? signingKeys[0] : signingKeys;
    if (!key.isDecrypted()) {
      throw new Error('Error signing message: Signing key is encrypted');
    }
    if (format === 'detached' || detached === true) {
      return '-----BEGIN PGP SIGNATURE-----\nsignature\n-----END PGP SIGNATURE-----';
    }
    return '-----BEGIN PGP SIGNED MESSAGE-----\nHello\n-----BEGIN PGP SIGNATURE-----\nsig\n-----END PGP SIGNATURE-----';
  });

  // Default successful verification
  mockVerify.mockImplementation(async ({ message, verificationKeys }) => {
    if (!verificationKeys || verificationKeys.length === 0) {
      throw new Error('No verification key provided');
    }
    return {
      signatures: [
        {
          keyID: { toHex: () => '0123456789ABCDEF' },
          verified: Promise.resolve(true),
          signature: {
            packets: [
              {
                created: new Date('2024-01-01'),
              },
            ],
          },
        },
      ],
      data: 'Original message',
    };
  });

  // Message creation mocks
  mockCreateMessage.mockImplementation(async ({ text }) => {
    return createMockMessage(text);
  });

  mockCreateCleartextMessage.mockImplementation(async ({ text }) => {
    return createMockMessage(text);
  });

  mockReadMessage.mockImplementation(async ({ armoredMessage }) => {
    return createMockMessage('encrypted', armoredMessage);
  });

  mockReadCleartextMessage.mockImplementation(async ({ cleartextMessage }) => {
    return createMockMessage('signed', cleartextMessage);
  });

  mockDecryptKey.mockImplementation(async ({ privateKey, passphrase }) => {
    if (!passphrase || passphrase.length === 0) {
      throw new Error('Passphrase required');
    }
    if (passphrase !== 'correct-passphrase') {
      throw new Error('Incorrect passphrase');
    }
    return createMockKey({ isDecrypted: true });
  });
}

/**
 * Reset all mocks to clean state
 */
export function resetMocks() {
  mockReadKey.mockReset();
  mockReadPrivateKey.mockReset();
  mockEncrypt.mockReset();
  mockDecrypt.mockReset();
  mockSign.mockReset();
  mockVerify.mockReset();
  mockCreateMessage.mockReset();
  mockCreateCleartextMessage.mockReset();
  mockReadMessage.mockReset();
  mockReadCleartextMessage.mockReset();
  mockDecryptKey.mockReset();
}

/**
 * Mock the entire openpgp module
 * This should be called at the top of test files with vi.mock()
 */
export function mockOpenpgpModule() {
  vi.mock('openpgp', () => ({
    readKey: mockReadKey,
    readPrivateKey: mockReadPrivateKey,
    encrypt: mockEncrypt,
    decrypt: mockDecrypt,
    sign: mockSign,
    verify: mockVerify,
    createMessage: mockCreateMessage,
    createCleartextMessage: mockCreateCleartextMessage,
    readMessage: mockReadMessage,
    readCleartextMessage: mockReadCleartextMessage,
    decryptKey: mockDecryptKey,
  }));
}
