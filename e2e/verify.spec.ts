import { test, expect } from '@playwright/test';
import { VerifyPage } from './pages';
import { TEST_KEYS, TEST_MESSAGES } from './fixtures/test-keys';

test.describe('Signature Verification', () => {
  let verifyPage: VerifyPage;

  test.beforeEach(async ({ page }) => {
    verifyPage = new VerifyPage(page);
    await verifyPage.goto();
  });

  test('verifies valid clear-signed message', async () => {
    await verifyPage.verify(TEST_KEYS.alice.publicKey, TEST_MESSAGES.signedByAlice);

    expect(await verifyPage.isValid()).toBe(true);
  });

  test('shows signer info for valid signature', async ({ page }) => {
    await verifyPage.verify(TEST_KEYS.alice.publicKey, TEST_MESSAGES.signedByAlice);

    await expect(verifyPage.validResult).toBeVisible();
    // Check for signer information - be more specific
    await expect(page.getByText('Alice Test', { exact: false }).first()).toBeVisible();
  });

  test('shows original message for valid clear-signed', async () => {
    await verifyPage.verify(TEST_KEYS.alice.publicKey, TEST_MESSAGES.signedByAlice);

    await expect(verifyPage.validResult).toBeVisible();
    await expect(verifyPage.originalMessage).toBeVisible();
    const message = await verifyPage.getOriginalMessage();
    expect(message).toContain(TEST_MESSAGES.plaintext);
  });

  test('shows invalid for wrong public key', async () => {
    await verifyPage.verify(TEST_KEYS.bob.publicKey, TEST_MESSAGES.signedByAlice);

    expect(await verifyPage.isInvalid()).toBe(true);
  });

  test('shows invalid for tampered message', async () => {
    // Modify the signed message content
    const tamperedMessage = TEST_MESSAGES.signedByAlice.replace(
      TEST_MESSAGES.plaintext,
      'This message has been tampered with!'
    );

    await verifyPage.verify(TEST_KEYS.alice.publicKey, tamperedMessage);

    expect(await verifyPage.isInvalid()).toBe(true);
  });

  test('shows error for invalid signature format', async () => {
    // Fill the form directly to avoid timing issues on WebKit
    await verifyPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await verifyPage.signedMessageTextarea.fill(
      '-----BEGIN PGP SIGNED MESSAGE-----\n\nInvalid\n-----BEGIN PGP SIGNATURE-----\n\nBad\n-----END PGP SIGNATURE-----'
    );

    // Wait for verify button to be enabled
    await expect(verifyPage.verifyButton).toBeEnabled({ timeout: 5000 });
    await verifyPage.verifyButton.click();

    await expect(verifyPage.errorMessage).toBeVisible();
  });

  test('shows error for malformed input', async () => {
    await verifyPage.verify(
      TEST_KEYS.alice.publicKey,
      'This is not a signed message at all'
    );

    await expect(verifyPage.errorMessage).toBeVisible();
  });

  test('displays key info for valid public key', async () => {
    await verifyPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await verifyPage.publicKeyTextarea.blur();

    await expect(verifyPage.keyInfoPanel).toBeVisible({ timeout: 5000 });
    // Fingerprint is displayed formatted with spaces
    await expect(verifyPage.keyInfoPanel).toContainText('1562 A178');
  });

  test('accepts private key in public key field (extracts public component)', async () => {
    // OpenPGP.js can extract the public key from a private key
    await verifyPage.publicKeyTextarea.fill(TEST_KEYS.alice.privateKey);
    await verifyPage.publicKeyTextarea.blur();

    // Should show key info since private keys contain the public key
    await expect(verifyPage.keyInfoPanel).toBeVisible();
  });

  test('verify button is disabled without public key', async () => {
    await verifyPage.signedMessageTextarea.fill(TEST_MESSAGES.signedByAlice);

    await expect(verifyPage.verifyButton).toBeDisabled();
  });

  test('verify button is disabled without signed message', async () => {
    await verifyPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await verifyPage.publicKeyTextarea.blur();

    await expect(verifyPage.verifyButton).toBeDisabled();
  });

  test('clear all resets the form', async () => {
    await verifyPage.verify(TEST_KEYS.alice.publicKey, TEST_MESSAGES.signedByAlice);

    await expect(verifyPage.validResult).toBeVisible();
    await verifyPage.clearAll();

    await expect(verifyPage.validResult).not.toBeVisible();
    await expect(verifyPage.publicKeyTextarea).toHaveValue('');
    await expect(verifyPage.signedMessageTextarea).toHaveValue('');
  });
});
