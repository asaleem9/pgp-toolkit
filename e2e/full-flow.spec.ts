import { test, expect } from '@playwright/test';
import { EncryptPage, DecryptPage, SignPage, VerifyPage } from './pages';
import { TEST_KEYS, TEST_MESSAGES } from './fixtures/test-keys';

test.describe('Encrypt-Decrypt Round Trip', () => {
  test('encrypts and decrypts message successfully', async ({ page }) => {
    const encryptPage = new EncryptPage(page);
    const decryptPage = new DecryptPage(page);

    // Encrypt
    await encryptPage.goto();
    await encryptPage.encrypt(TEST_KEYS.alice.publicKey, 'Secret round-trip message');
    await expect(encryptPage.outputTextarea).toBeVisible();
    const encryptedMessage = await encryptPage.getEncryptedOutput();

    // Decrypt
    await decryptPage.goto();
    await decryptPage.decrypt(TEST_KEYS.alice.privateKey, encryptedMessage);
    await expect(decryptPage.outputTextarea).toBeVisible();
    const decryptedMessage = await decryptPage.getDecryptedOutput();

    expect(decryptedMessage).toBe('Secret round-trip message');
  });

  test('encrypts to multiple recipients and decrypts with first key', async ({ page }) => {
    const encryptPage = new EncryptPage(page);
    const decryptPage = new DecryptPage(page);

    // Encrypt to Alice and Bob
    await encryptPage.goto();
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await encryptPage.addRecipient();
    const secondKeyInput = await encryptPage.getRecipientTextarea(1);
    await secondKeyInput.fill(TEST_KEYS.bob.publicKey);
    await secondKeyInput.blur();

    await encryptPage.messageInput.fill('Multi-recipient secret');
    await encryptPage.encryptButton.click();

    await expect(encryptPage.outputTextarea).toBeVisible();
    const encryptedMessage = await encryptPage.getEncryptedOutput();

    // Decrypt with Alice's key
    await decryptPage.goto();
    await decryptPage.decrypt(TEST_KEYS.alice.privateKey, encryptedMessage);
    await expect(decryptPage.outputTextarea).toBeVisible();
    const decryptedMessage = await decryptPage.getDecryptedOutput();

    expect(decryptedMessage).toBe('Multi-recipient secret');
  });

  test('encrypts to multiple recipients and decrypts with second key', async ({ page }) => {
    const encryptPage = new EncryptPage(page);
    const decryptPage = new DecryptPage(page);

    // Encrypt to Alice and Bob
    await encryptPage.goto();
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await encryptPage.addRecipient();
    const secondKeyInput = await encryptPage.getRecipientTextarea(1);
    await secondKeyInput.fill(TEST_KEYS.bob.publicKey);
    await secondKeyInput.blur();

    await encryptPage.messageInput.fill('Multi-recipient secret');
    await encryptPage.encryptButton.click();

    await expect(encryptPage.outputTextarea).toBeVisible();
    const encryptedMessage = await encryptPage.getEncryptedOutput();

    // Decrypt with Bob's key
    await decryptPage.goto();
    await decryptPage.decrypt(
      TEST_KEYS.bob.privateKey,
      encryptedMessage,
      TEST_KEYS.bob.passphrase
    );
    await expect(decryptPage.outputTextarea).toBeVisible();
    const decryptedMessage = await decryptPage.getDecryptedOutput();

    expect(decryptedMessage).toBe('Multi-recipient secret');
  });

  test('encrypt-to-self allows decryption with self key', async ({ page }) => {
    const encryptPage = new EncryptPage(page);
    const decryptPage = new DecryptPage(page);

    // Encrypt to Alice with encrypt-to-self (Charlie)
    await encryptPage.goto();
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await encryptPage.enableEncryptToSelf(TEST_KEYS.charlie.publicKey);

    await encryptPage.messageInput.fill('Encrypt to self test');
    await encryptPage.encryptButton.click();

    await expect(encryptPage.outputTextarea).toBeVisible();
    const encryptedMessage = await encryptPage.getEncryptedOutput();

    // Decrypt with Charlie's key (the "self" key)
    await decryptPage.goto();
    await decryptPage.decrypt(TEST_KEYS.charlie.privateKey, encryptedMessage);
    await expect(decryptPage.outputTextarea).toBeVisible();
    const decryptedMessage = await decryptPage.getDecryptedOutput();

    expect(decryptedMessage).toBe('Encrypt to self test');
  });
});

test.describe('Sign-Verify Round Trip', () => {
  test('signs and verifies clear-signed message', async ({ page }) => {
    const signPage = new SignPage(page);
    const verifyPage = new VerifyPage(page);

    // Sign
    await signPage.goto();
    await signPage.sign(TEST_KEYS.alice.privateKey, 'Signed round-trip message');
    await expect(signPage.outputTextarea).toBeVisible();
    const signedMessage = await signPage.getSignedOutput();

    // Verify
    await verifyPage.goto();
    await verifyPage.verify(TEST_KEYS.alice.publicKey, signedMessage);

    expect(await verifyPage.isValid()).toBe(true);
    const originalMessage = await verifyPage.getOriginalMessage();
    expect(originalMessage).toContain('Signed round-trip message');
  });

  test('signs with passphrase-protected key and verifies', async ({ page }) => {
    const signPage = new SignPage(page);
    const verifyPage = new VerifyPage(page);

    // Sign with Bob's protected key
    await signPage.goto();
    await signPage.sign(
      TEST_KEYS.bob.privateKey,
      'Protected key signature',
      TEST_KEYS.bob.passphrase
    );
    await expect(signPage.outputTextarea).toBeVisible();
    const signedMessage = await signPage.getSignedOutput();

    // Verify with Bob's public key
    await verifyPage.goto();
    await verifyPage.verify(TEST_KEYS.bob.publicKey, signedMessage);

    expect(await verifyPage.isValid()).toBe(true);
  });

  test('detects tampered signed message', async ({ page }) => {
    const signPage = new SignPage(page);
    const verifyPage = new VerifyPage(page);

    // Sign
    await signPage.goto();
    await signPage.sign(TEST_KEYS.alice.privateKey, 'Original message');
    await expect(signPage.outputTextarea).toBeVisible();
    let signedMessage = await signPage.getSignedOutput();

    // Tamper with the message
    signedMessage = signedMessage.replace('Original message', 'Tampered message');

    // Verify should fail
    await verifyPage.goto();
    await verifyPage.verify(TEST_KEYS.alice.publicKey, signedMessage);

    expect(await verifyPage.isInvalid()).toBe(true);
  });

  test('wrong public key fails verification', async ({ page }) => {
    const signPage = new SignPage(page);
    const verifyPage = new VerifyPage(page);

    // Sign with Alice's key
    await signPage.goto();
    await signPage.sign(TEST_KEYS.alice.privateKey, 'Message from Alice');
    await expect(signPage.outputTextarea).toBeVisible();
    const signedMessage = await signPage.getSignedOutput();

    // Try to verify with Bob's public key (should fail)
    await verifyPage.goto();
    await verifyPage.verify(TEST_KEYS.bob.publicKey, signedMessage);

    expect(await verifyPage.isInvalid()).toBe(true);
  });
});

test.describe('Cross-Feature Flows', () => {
  test('encrypts signed message (encrypt after sign)', async ({ page }) => {
    const signPage = new SignPage(page);
    const encryptPage = new EncryptPage(page);
    const decryptPage = new DecryptPage(page);
    const verifyPage = new VerifyPage(page);

    // Sign message
    await signPage.goto();
    await signPage.sign(TEST_KEYS.alice.privateKey, 'Double-protected message');
    await expect(signPage.outputTextarea).toBeVisible();
    const signedMessage = await signPage.getSignedOutput();

    // Encrypt the signed message
    await encryptPage.goto();
    await encryptPage.encrypt(TEST_KEYS.bob.publicKey, signedMessage);
    await expect(encryptPage.outputTextarea).toBeVisible();
    const encryptedSignedMessage = await encryptPage.getEncryptedOutput();

    // Decrypt
    await decryptPage.goto();
    await decryptPage.decrypt(
      TEST_KEYS.bob.privateKey,
      encryptedSignedMessage,
      TEST_KEYS.bob.passphrase
    );
    await expect(decryptPage.outputTextarea).toBeVisible();
    const decryptedMessage = await decryptPage.getDecryptedOutput();

    // Verify the decrypted (signed) message
    await verifyPage.goto();
    await verifyPage.verify(TEST_KEYS.alice.publicKey, decryptedMessage);

    expect(await verifyPage.isValid()).toBe(true);
    const originalMessage = await verifyPage.getOriginalMessage();
    expect(originalMessage).toContain('Double-protected message');
  });

  test('uses RSA keys for encrypt-decrypt', async ({ page }) => {
    const encryptPage = new EncryptPage(page);
    const decryptPage = new DecryptPage(page);

    // Encrypt with RSA key
    await encryptPage.goto();
    await encryptPage.encrypt(TEST_KEYS.rsa.publicKey, 'RSA encrypted message');
    await expect(encryptPage.outputTextarea).toBeVisible();
    const encryptedMessage = await encryptPage.getEncryptedOutput();

    // Decrypt with RSA key
    await decryptPage.goto();
    await decryptPage.decrypt(TEST_KEYS.rsa.privateKey, encryptedMessage);
    await expect(decryptPage.outputTextarea).toBeVisible();
    const decryptedMessage = await decryptPage.getDecryptedOutput();

    expect(decryptedMessage).toBe('RSA encrypted message');
  });

  test('uses RSA keys for sign-verify', async ({ page }) => {
    const signPage = new SignPage(page);
    const verifyPage = new VerifyPage(page);

    // Sign with RSA key
    await signPage.goto();
    await signPage.sign(TEST_KEYS.rsa.privateKey, 'RSA signed message');
    await expect(signPage.outputTextarea).toBeVisible();
    const signedMessage = await signPage.getSignedOutput();

    // Verify with RSA key
    await verifyPage.goto();
    await verifyPage.verify(TEST_KEYS.rsa.publicKey, signedMessage);

    expect(await verifyPage.isValid()).toBe(true);
  });
});

test.describe('Tab Navigation', () => {
  test('navigates between all tabs', async ({ page }) => {
    await page.goto('/');

    // Navigate to each tab and verify content
    await page.getByRole('tab', { name: 'Encrypt' }).click();
    await expect(page.locator('text=Encrypt a Message')).toBeVisible();

    await page.getByRole('tab', { name: 'Decrypt' }).click();
    await expect(page.locator('text=Decrypt a Message')).toBeVisible();

    await page.getByRole('tab', { name: 'Sign' }).click();
    await expect(page.locator('text=Sign a Message')).toBeVisible();

    await page.getByRole('tab', { name: 'Verify' }).click();
    await expect(page.locator('text=Verify a Signature')).toBeVisible();

    await page.getByRole('tab', { name: 'Inspect' }).click();
    await expect(page.locator('text=Key Inspector')).toBeVisible();
  });

  test('clears form state when switching tabs (security feature)', async ({ page }) => {
    const encryptPage = new EncryptPage(page);

    // Fill encrypt form
    await encryptPage.goto();
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.messageInput.fill('Test message');

    // Switch to another tab
    await page.getByRole('tab', { name: 'Decrypt' }).click();
    await expect(page.locator('text=Decrypt a Message')).toBeVisible();

    // Switch back
    await page.getByRole('tab', { name: 'Encrypt' }).click();

    // Form should be cleared (security feature - sensitive data cleared on unmount)
    await expect(encryptPage.publicKeyTextarea).toHaveValue('');
    await expect(encryptPage.messageInput).toHaveValue('');
  });
});
