import * as openpgp from 'openpgp';

export interface KeyInfo {
  fingerprint: string;
  userIds: string[];
  algorithm: string;
  created: Date;
  expirationDate: Date | null;
  isExpired: boolean;
  isEncrypted?: boolean;
}

export interface EncryptResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface DecryptResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface SignResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface VerifyResult {
  success: boolean;
  valid?: boolean;
  signedBy?: string;
  signedAt?: Date;
  message?: string;
  error?: string;
}

/**
 * Parses a public key and extracts information
 */
export async function parsePublicKey(armoredKey: string): Promise<KeyInfo | null> {
  try {
    const key = await openpgp.readKey({ armoredKey });
    const expirationTime = await key.getExpirationTime();
    const expirationDate = expirationTime instanceof Date ? expirationTime : null;
    const isExpired = expirationDate ? expirationDate < new Date() : false;

    return {
      fingerprint: key.getFingerprint().toUpperCase(),
      userIds: key.getUserIDs(),
      algorithm: key.getAlgorithmInfo().algorithm,
      created: key.getCreationTime(),
      expirationDate,
      isExpired,
    };
  } catch {
    return null;
  }
}

/**
 * Parses a private key and extracts information
 */
export async function parsePrivateKey(armoredKey: string): Promise<KeyInfo | null> {
  try {
    const key = await openpgp.readPrivateKey({ armoredKey });
    const expirationTime = await key.getExpirationTime();
    const expirationDate = expirationTime instanceof Date ? expirationTime : null;
    const isExpired = expirationDate ? expirationDate < new Date() : false;

    return {
      fingerprint: key.getFingerprint().toUpperCase(),
      userIds: key.getUserIDs(),
      algorithm: key.getAlgorithmInfo().algorithm,
      created: key.getCreationTime(),
      expirationDate,
      isExpired,
      isEncrypted: !key.isDecrypted(),
    };
  } catch {
    return null;
  }
}

/**
 * Encrypts a message using one or more public keys
 */
export async function encryptMessage(
  plaintext: string,
  armoredPublicKeys: string | string[]
): Promise<EncryptResult> {
  try {
    const keyArray = Array.isArray(armoredPublicKeys) ? armoredPublicKeys : [armoredPublicKeys];

    if (keyArray.length === 0) {
      return {
        success: false,
        error: 'At least one public key is required',
      };
    }

    const publicKeys = await Promise.all(
      keyArray.map(key => openpgp.readKey({ armoredKey: key }))
    );

    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: plaintext }),
      encryptionKeys: publicKeys,
    });

    return {
      success: true,
      data: encrypted as string,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Encryption failed',
    };
  }
}

/**
 * Decrypts a message using a private key
 */
export async function decryptMessage(
  encryptedMessage: string,
  armoredPrivateKey: string,
  passphrase?: string
): Promise<DecryptResult> {
  try {
    let privateKey = await openpgp.readPrivateKey({ armoredKey: armoredPrivateKey });

    // Decrypt the private key if it's encrypted and a passphrase is provided
    if (!privateKey.isDecrypted()) {
      if (!passphrase) {
        return {
          success: false,
          error: 'This private key is protected by a passphrase. Please enter your passphrase.',
        };
      }

      try {
        privateKey = await openpgp.decryptKey({
          privateKey,
          passphrase,
        });
      } catch {
        return {
          success: false,
          error: 'Incorrect passphrase. Please try again.',
        };
      }
    }

    const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });

    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
    });

    return {
      success: true,
      data: decrypted as string,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Decryption failed';

    // Provide user-friendly error messages
    if (errorMessage.includes('Session key decryption failed')) {
      return {
        success: false,
        error: 'Could not decrypt this message. Make sure you\'re using the correct private key.',
      };
    }

    return {
      success: false,
      error: 'Could not decrypt this message. Make sure you\'re using the correct private key.',
    };
  }
}

/**
 * Signs a message using a private key
 */
export async function signMessage(
  message: string,
  armoredPrivateKey: string,
  passphrase?: string,
  detached: boolean = false
): Promise<SignResult> {
  try {
    let privateKey = await openpgp.readPrivateKey({ armoredKey: armoredPrivateKey });

    // Decrypt the private key if it's encrypted
    if (!privateKey.isDecrypted()) {
      if (!passphrase) {
        return {
          success: false,
          error: 'This private key is protected by a passphrase. Please enter your passphrase.',
        };
      }

      try {
        privateKey = await openpgp.decryptKey({
          privateKey,
          passphrase,
        });
      } catch {
        return {
          success: false,
          error: 'Incorrect passphrase. Please try again.',
        };
      }
    }

    if (detached) {
      // Detached signature - just the signature, separate from message
      const messageObj = await openpgp.createMessage({ text: message });
      const signature = await openpgp.sign({
        message: messageObj,
        signingKeys: privateKey,
        detached: true,
      });

      return {
        success: true,
        data: signature as string,
      };
    } else {
      // Clear-signed message - message and signature combined, human-readable
      const cleartextMessage = await openpgp.createCleartextMessage({ text: message });
      const signedMessage = await openpgp.sign({
        message: cleartextMessage,
        signingKeys: privateKey,
      });

      return {
        success: true,
        data: signedMessage as string,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signing failed',
    };
  }
}

/**
 * Verifies a signed message using a public key
 */
export async function verifySignature(
  signedMessage: string,
  armoredPublicKey: string
): Promise<VerifyResult> {
  try {
    const publicKey = await openpgp.readKey({ armoredKey: armoredPublicKey });

    // Try to read as clear-signed message
    let message;
    try {
      message = await openpgp.readCleartextMessage({ cleartextMessage: signedMessage });
    } catch {
      // Try as regular signed message
      message = await openpgp.readMessage({ armoredMessage: signedMessage });
    }

    const verificationResult = await openpgp.verify({
      message,
      verificationKeys: publicKey,
    });

    const { verified, signature } = verificationResult.signatures[0];

    try {
      await verified;
      const signaturePacket = await signature;
      const signedAt = signaturePacket?.packets?.[0]?.created;

      return {
        success: true,
        valid: true,
        signedBy: publicKey.getUserIDs()[0] || 'Unknown',
        signedAt: signedAt instanceof Date ? signedAt : undefined,
        message: typeof verificationResult.data === 'string' ? verificationResult.data : undefined,
      };
    } catch {
      return {
        success: true,
        valid: false,
        error: 'Signature verification failed. The message may have been tampered with or signed by a different key.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Could not verify the signature.',
    };
  }
}

/**
 * Formats a fingerprint for display (groups of 4)
 */
export function formatFingerprint(fingerprint: string): string {
  return fingerprint.match(/.{1,4}/g)?.join(' ') ?? fingerprint;
}

export type ExpiryStatus = 'valid' | 'expiring-soon' | 'expiring-week' | 'expired' | 'no-expiry';

export interface SubkeyInfo {
  keyId: string;
  algorithm: string;
  created: Date;
  expirationDate: Date | null;
  capabilities: string[];
}

export interface DetailedKeyInfo {
  type: 'public' | 'private';
  fingerprint: string;
  keyId: string;
  algorithm: string;
  bitSize?: number;
  curve?: string;
  created: Date;
  expirationDate: Date | null;
  isExpired: boolean;
  userIds: string[];
  subkeys: SubkeyInfo[];
  capabilities: {
    certify: boolean;
    sign: boolean;
    encrypt: boolean;
    authenticate: boolean;
  };
  isEncrypted?: boolean;
}

/**
 * Inspects a key and returns detailed information
 */
export async function inspectKey(armoredKey: string): Promise<DetailedKeyInfo | null> {
  try {
    const isPrivate = armoredKey.includes('PRIVATE KEY BLOCK');
    const key = isPrivate
      ? await openpgp.readPrivateKey({ armoredKey })
      : await openpgp.readKey({ armoredKey });

    const expirationTime = await key.getExpirationTime();
    const expirationDate = expirationTime instanceof Date ? expirationTime : null;
    const isExpired = expirationDate ? expirationDate < new Date() : false;

    const algorithmInfo = key.getAlgorithmInfo();
    const keyId = key.getKeyID().toHex().toUpperCase();

    // Get subkeys
    const subkeys: SubkeyInfo[] = [];
    for (const subkey of key.getSubkeys()) {
      const subkeyAlgoInfo = subkey.getAlgorithmInfo();
      const subkeyExpTime = await subkey.getExpirationTime();
      const subkeyExpDate = subkeyExpTime instanceof Date ? subkeyExpTime : null;

      // Determine capabilities based on algorithm
      // Encryption algorithms: ECDH, ElGamal
      // Signing algorithms: EdDSA, ECDSA, RSA, DSA
      const algo = subkeyAlgoInfo.algorithm.toLowerCase();
      const caps: string[] = [];
      if (algo.includes('ecdh') || algo.includes('elgamal')) {
        caps.push('encrypt');
      }
      if (algo.includes('eddsa') || algo.includes('ecdsa') || algo.includes('dsa')) {
        caps.push('sign');
      }
      if (algo.includes('rsa')) {
        // RSA can do both
        caps.push('encrypt', 'sign');
      }
      if (caps.length === 0) {
        caps.push('encrypt'); // Default assumption
      }

      subkeys.push({
        keyId: subkey.getKeyID().toHex().toUpperCase(),
        algorithm: subkeyAlgoInfo.algorithm,
        created: subkey.getCreationTime(),
        expirationDate: subkeyExpDate,
        capabilities: caps,
      });
    }

    // Get primary key capabilities
    const capabilities = {
      certify: true, // Primary keys can always certify
      sign: false,
      encrypt: false,
      authenticate: false,
    };

    try {
      await key.getSigningKey();
      capabilities.sign = true;
    } catch { /* ignore */ }

    try {
      await key.getEncryptionKey();
      capabilities.encrypt = true;
    } catch { /* ignore */ }

    return {
      type: isPrivate ? 'private' : 'public',
      fingerprint: key.getFingerprint().toUpperCase(),
      keyId,
      algorithm: algorithmInfo.algorithm,
      bitSize: 'bits' in algorithmInfo ? algorithmInfo.bits : undefined,
      curve: 'curve' in algorithmInfo ? String(algorithmInfo.curve) : undefined,
      created: key.getCreationTime(),
      expirationDate,
      isExpired,
      userIds: key.getUserIDs(),
      subkeys,
      capabilities,
      isEncrypted: isPrivate ? !(key as openpgp.PrivateKey).isDecrypted() : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Gets the expiry status of a key
 */
export function getExpiryStatus(expirationDate: Date | null): ExpiryStatus {
  if (!expirationDate) {
    return 'no-expiry';
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 7) {
    return 'expiring-week';
  } else if (daysUntilExpiry <= 30) {
    return 'expiring-soon';
  }

  return 'valid';
}

/**
 * Gets days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(expirationDate: Date | null): number | null {
  if (!expirationDate) {
    return null;
  }

  const now = new Date();
  return Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
