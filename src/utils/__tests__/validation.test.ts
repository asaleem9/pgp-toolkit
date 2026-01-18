/**
 * Tests for validation utilities
 * Target: 100% coverage
 */

import { describe, it, expect } from 'vitest';
import {
  validatePublicKey,
  validatePrivateKey,
  validateEncryptedMessage,
  validateMessageSize,
  validatePlaintext,
} from '../validation';
import { TEST_MESSAGES, TEST_PGP_BLOCKS, generateString } from '../../test/helpers/testUtils';

describe('validatePublicKey', () => {
  it('should validate a valid public key', () => {
    const result = validatePublicKey(TEST_PGP_BLOCKS.validPublicKey);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject an empty string', () => {
    const result = validatePublicKey('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Public key is required');
  });

  it('should reject a whitespace-only string', () => {
    const result = validatePublicKey('   \n\t  ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Public key is required');
  });

  it('should reject a key missing BEGIN marker', () => {
    const result = validatePublicKey(TEST_PGP_BLOCKS.missingBeginMarker);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP PUBLIC KEY BLOCK');
  });

  it('should reject a key missing END marker', () => {
    const result = validatePublicKey(TEST_PGP_BLOCKS.missingEndMarker);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('END PGP PUBLIC KEY BLOCK');
  });

  it('should reject a private key (wrong block type)', () => {
    const result = validatePublicKey(TEST_PGP_BLOCKS.validPrivateKey);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP PUBLIC KEY BLOCK');
  });

  it('should reject a message (wrong block type)', () => {
    const result = validatePublicKey(TEST_PGP_BLOCKS.validMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP PUBLIC KEY BLOCK');
  });

  it('should trim leading and trailing whitespace before validation', () => {
    const keyWithWhitespace = `\n\n  ${TEST_PGP_BLOCKS.validPublicKey}  \n\n`;
    const result = validatePublicKey(keyWithWhitespace);
    expect(result.valid).toBe(true);
  });
});

describe('validatePrivateKey', () => {
  it('should validate a valid private key', () => {
    const result = validatePrivateKey(TEST_PGP_BLOCKS.validPrivateKey);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject an empty string', () => {
    const result = validatePrivateKey('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Private key is required');
  });

  it('should reject a whitespace-only string', () => {
    const result = validatePrivateKey('   \n\t  ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Private key is required');
  });

  it('should reject a key missing BEGIN marker', () => {
    const invalidKey = `xjMEaVjUcRYJKwYBBAHaRw8BAQdAjvAVYWt6g2PKj+CloVqp2lGfIKdJCPeM
=test
-----END PGP PRIVATE KEY BLOCK-----`;
    const result = validatePrivateKey(invalidKey);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP PRIVATE KEY BLOCK');
  });

  it('should reject a key missing END marker', () => {
    const invalidKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----
xjMEaVjUcRYJKwYBBAHaRw8BAQdAjvAVYWt6g2PKj+CloVqp2lGfIKdJCPeM`;
    const result = validatePrivateKey(invalidKey);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('END PGP PRIVATE KEY BLOCK');
  });

  it('should reject a public key (wrong block type)', () => {
    const result = validatePrivateKey(TEST_PGP_BLOCKS.validPublicKey);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP PRIVATE KEY BLOCK');
  });

  it('should reject a message (wrong block type)', () => {
    const result = validatePrivateKey(TEST_PGP_BLOCKS.validMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP PRIVATE KEY BLOCK');
  });

  it('should trim leading and trailing whitespace before validation', () => {
    const keyWithWhitespace = `\n\n  ${TEST_PGP_BLOCKS.validPrivateKey}  \n\n`;
    const result = validatePrivateKey(keyWithWhitespace);
    expect(result.valid).toBe(true);
  });
});

describe('validateEncryptedMessage', () => {
  it('should validate a valid encrypted message', () => {
    const result = validateEncryptedMessage(TEST_PGP_BLOCKS.validMessage);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject an empty string', () => {
    const result = validateEncryptedMessage('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Encrypted message is required');
  });

  it('should reject a whitespace-only string', () => {
    const result = validateEncryptedMessage('   \n\t  ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Encrypted message is required');
  });

  it('should reject a message missing BEGIN marker', () => {
    const invalidMessage = `wV4D7s3YJZvzdgYSAQdAOJh89gz+Wc+mnWY23IvGy5yq9omTHJNbdxBO/5TE
=test
-----END PGP MESSAGE-----`;
    const result = validateEncryptedMessage(invalidMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP MESSAGE');
  });

  it('should reject a message missing END marker', () => {
    const invalidMessage = `-----BEGIN PGP MESSAGE-----
wV4D7s3YJZvzdgYSAQdAOJh89gz+Wc+mnWY23IvGy5yq9omTHJNbdxBO/5TE`;
    const result = validateEncryptedMessage(invalidMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('END PGP MESSAGE');
  });

  it('should reject a public key (wrong block type)', () => {
    const result = validateEncryptedMessage(TEST_PGP_BLOCKS.validPublicKey);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP MESSAGE');
  });

  it('should reject a signature block (wrong block type)', () => {
    const signatureBlock = `-----BEGIN PGP SIGNATURE-----
wrsEARYKAG0FgmlY1HEJEIGbX0gVYqF4RRQAAAAAABwAIHNhbHRAbm90YXRp
=test
-----END PGP SIGNATURE-----`;
    const result = validateEncryptedMessage(signatureBlock);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('BEGIN PGP MESSAGE');
  });

  it('should trim leading and trailing whitespace before validation', () => {
    const messageWithWhitespace = `\n\n  ${TEST_PGP_BLOCKS.validMessage}  \n\n`;
    const result = validateEncryptedMessage(messageWithWhitespace);
    expect(result.valid).toBe(true);
  });
});

describe('validateMessageSize', () => {
  it('should validate a message under 1MB', () => {
    const result = validateMessageSize(TEST_MESSAGES.medium);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should validate a message at the 1MB boundary', () => {
    const message = generateString(1024 * 1024); // Exactly 1MB
    const result = validateMessageSize(message);
    expect(result.valid).toBe(true);
  });

  it('should reject a message just over 1MB', () => {
    const message = generateString(1024 * 1024 + 1); // 1MB + 1 byte
    const result = validateMessageSize(message);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Message exceeds maximum size (1MB)');
    expect(result.error).toContain('1.00MB');
  });

  it('should reject a large message and show size in MB', () => {
    const message = generateString(2 * 1024 * 1024); // 2MB
    const result = validateMessageSize(message);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Message exceeds maximum size (1MB)');
    expect(result.error).toContain('2.00MB');
  });

  it('should validate an empty message (size check only)', () => {
    const result = validateMessageSize('');
    expect(result.valid).toBe(true);
  });

  it('should handle unicode characters correctly in size calculation', () => {
    // Unicode characters can be multiple bytes
    const unicodeMessage = '🌍'.repeat(350000); // Emojis are 4 bytes each = ~1.4MB
    const result = validateMessageSize(unicodeMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum size');
  });
});

describe('validatePlaintext', () => {
  it('should validate a non-empty message under size limit', () => {
    const result = validatePlaintext(TEST_MESSAGES.medium);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject an empty string', () => {
    const result = validatePlaintext('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message is required');
  });

  it('should reject a whitespace-only string', () => {
    const result = validatePlaintext('   \n\t  ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Message is required');
  });

  it('should reject a message over 1MB', () => {
    const largeMessage = generateString(1024 * 1024 + 100);
    const result = validatePlaintext(largeMessage);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum size');
  });

  it('should validate a message with unicode characters', () => {
    const result = validatePlaintext(TEST_MESSAGES.unicode);
    expect(result.valid).toBe(true);
  });

  it('should validate a message with emojis', () => {
    const result = validatePlaintext(TEST_MESSAGES.emoji);
    expect(result.valid).toBe(true);
  });

  it('should validate a multiline message', () => {
    const result = validatePlaintext(TEST_MESSAGES.multiline);
    expect(result.valid).toBe(true);
  });

  it('should validate a message at the size limit', () => {
    const atLimit = generateString(1024 * 1024); // Exactly 1MB
    const result = validatePlaintext(atLimit);
    expect(result.valid).toBe(true);
  });

  it('should validate a message with special characters', () => {
    const result = validatePlaintext(TEST_MESSAGES.specialChars);
    expect(result.valid).toBe(true);
  });
});
