/**
 * Script to generate test PGP key fixtures
 * Run with: npx tsx src/test/fixtures/generate-keys.ts
 */
import * as openpgp from 'openpgp';

async function generateTestKeys() {
  // Generate Alice's key (unencrypted)
  const aliceKey = await openpgp.generateKey({
    type: 'ecc',
    curve: 'curve25519',
    userIDs: [{ name: 'Alice Test', email: 'alice@test.com' }],
    format: 'armored',
  });

  // Generate Bob's key (password protected)
  const bobKey = await openpgp.generateKey({
    type: 'ecc',
    curve: 'curve25519',
    userIDs: [{ name: 'Bob Test', email: 'bob@test.com' }],
    passphrase: 'test123',
    format: 'armored',
  });

  // Generate Charlie's key (for multi-recipient tests)
  const charlieKey = await openpgp.generateKey({
    type: 'ecc',
    curve: 'curve25519',
    userIDs: [{ name: 'Charlie Test', email: 'charlie@test.com' }],
    format: 'armored',
  });

  // Generate RSA key (for testing different algorithms)
  const rsaKey = await openpgp.generateKey({
    type: 'rsa',
    rsaBits: 2048,
    userIDs: [{ name: 'RSA Test', email: 'rsa@test.com' }],
    format: 'armored',
  });

  // Get fingerprints
  const alicePublic = await openpgp.readKey({ armoredKey: aliceKey.publicKey });
  const bobPublic = await openpgp.readKey({ armoredKey: bobKey.publicKey });
  const charliePublic = await openpgp.readKey({ armoredKey: charlieKey.publicKey });
  const rsaPublic = await openpgp.readKey({ armoredKey: rsaKey.publicKey });

  // Create test encrypted message (encrypted to Alice)
  const testMessage = 'Hello, this is a test message!';
  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: testMessage }),
    encryptionKeys: alicePublic,
  });

  // Create test signed message (signed by Alice)
  const alicePrivate = await openpgp.readPrivateKey({ armoredKey: aliceKey.privateKey });
  const signed = await openpgp.sign({
    message: await openpgp.createCleartextMessage({ text: testMessage }),
    signingKeys: alicePrivate,
  });

  // Create detached signature
  const detachedSig = await openpgp.sign({
    message: await openpgp.createMessage({ text: testMessage }),
    signingKeys: alicePrivate,
    detached: true,
  });

  const output = `/**
 * AUTO-GENERATED TEST KEYS - DO NOT USE IN PRODUCTION
 * Generated on: ${new Date().toISOString()}
 */

export const TEST_KEYS = {
  alice: {
    publicKey: \`${aliceKey.publicKey}\`,
    privateKey: \`${aliceKey.privateKey}\`,
    fingerprint: '${alicePublic.getFingerprint().toUpperCase()}',
    keyId: '${alicePublic.getKeyID().toHex().toUpperCase()}',
    userId: 'Alice Test <alice@test.com>',
  },
  bob: {
    publicKey: \`${bobKey.publicKey}\`,
    privateKey: \`${bobKey.privateKey}\`,
    passphrase: 'test123',
    fingerprint: '${bobPublic.getFingerprint().toUpperCase()}',
    keyId: '${bobPublic.getKeyID().toHex().toUpperCase()}',
    userId: 'Bob Test <bob@test.com>',
  },
  charlie: {
    publicKey: \`${charlieKey.publicKey}\`,
    privateKey: \`${charlieKey.privateKey}\`,
    fingerprint: '${charliePublic.getFingerprint().toUpperCase()}',
    keyId: '${charliePublic.getKeyID().toHex().toUpperCase()}',
    userId: 'Charlie Test <charlie@test.com>',
  },
  rsa: {
    publicKey: \`${rsaKey.publicKey}\`,
    privateKey: \`${rsaKey.privateKey}\`,
    fingerprint: '${rsaPublic.getFingerprint().toUpperCase()}',
    keyId: '${rsaPublic.getKeyID().toHex().toUpperCase()}',
    userId: 'RSA Test <rsa@test.com>',
  },
};

export const TEST_MESSAGES = {
  plaintext: '${testMessage}',
  encryptedToAlice: \`${encrypted}\`,
  signedByAlice: \`${signed}\`,
  detachedSignature: \`${detachedSig}\`,
};

export const INVALID_KEYS = {
  malformed: '-----BEGIN PGP PUBLIC KEY BLOCK-----\\n\\nThis is not a valid key\\n-----END PGP PUBLIC KEY BLOCK-----',
  truncated: '-----BEGIN PGP PUBLIC KEY BLOCK-----\\n\\nmQGNBGV',
  wrongType: '-----BEGIN PGP MESSAGE-----\\n\\nSome message content\\n-----END PGP MESSAGE-----',
};
`;

  console.log(output);
}

generateTestKeys().catch(console.error);
