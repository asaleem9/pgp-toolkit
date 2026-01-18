const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePublicKey(key: string): ValidationResult {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'Public key is required' };
  }

  const trimmed = key.trim();

  if (!trimmed.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
    return {
      valid: false,
      error: "This doesn't appear to be a valid PGP public key. It should start with '-----BEGIN PGP PUBLIC KEY BLOCK-----'"
    };
  }

  if (!trimmed.includes('-----END PGP PUBLIC KEY BLOCK-----')) {
    return {
      valid: false,
      error: "This doesn't appear to be a valid PGP public key. It should end with '-----END PGP PUBLIC KEY BLOCK-----'"
    };
  }

  return { valid: true };
}

export function validatePrivateKey(key: string): ValidationResult {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'Private key is required' };
  }

  const trimmed = key.trim();

  if (!trimmed.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----')) {
    return {
      valid: false,
      error: "This doesn't appear to be a valid PGP private key. It should start with '-----BEGIN PGP PRIVATE KEY BLOCK-----'"
    };
  }

  if (!trimmed.includes('-----END PGP PRIVATE KEY BLOCK-----')) {
    return {
      valid: false,
      error: "This doesn't appear to be a valid PGP private key. It should end with '-----END PGP PRIVATE KEY BLOCK-----'"
    };
  }

  return { valid: true };
}

export function validateEncryptedMessage(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Encrypted message is required' };
  }

  const trimmed = message.trim();

  if (!trimmed.includes('-----BEGIN PGP MESSAGE-----')) {
    return {
      valid: false,
      error: "This doesn't appear to be a valid PGP message. It should start with '-----BEGIN PGP MESSAGE-----'"
    };
  }

  if (!trimmed.includes('-----END PGP MESSAGE-----')) {
    return {
      valid: false,
      error: "This doesn't appear to be a valid PGP message. It should end with '-----END PGP MESSAGE-----'"
    };
  }

  return { valid: true };
}

export function validateMessageSize(message: string): ValidationResult {
  const size = new Blob([message]).size;

  if (size > MAX_MESSAGE_SIZE) {
    return {
      valid: false,
      error: `Message exceeds maximum size (1MB). Current size: ${(size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return { valid: true };
}

export function validatePlaintext(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message is required' };
  }

  return validateMessageSize(message);
}
