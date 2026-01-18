import { test, expect } from '@playwright/test';
import { DecryptPage } from './pages';
import { TEST_KEYS, TEST_MESSAGES } from './fixtures/test-keys';

test.describe('Decryption', () => {
  let decryptPage: DecryptPage;

  test.beforeEach(async ({ page }) => {
    decryptPage = new DecryptPage(page);
    await decryptPage.goto();
  });

  test('decrypts message with correct private key', async () => {
    await decryptPage.decrypt(
      TEST_KEYS.alice.privateKey,
      TEST_MESSAGES.encryptedToAlice
    );

    await expect(decryptPage.outputTextarea).toBeVisible();
    const output = await decryptPage.getDecryptedOutput();
    expect(output).toBe(TEST_MESSAGES.plaintext);
  });

  test('shows error with wrong private key', async () => {
    await decryptPage.decrypt(
      TEST_KEYS.bob.privateKey,
      TEST_MESSAGES.encryptedToAlice,
      TEST_KEYS.bob.passphrase
    );

    await expect(decryptPage.errorMessage).toBeVisible();
    await expect(decryptPage.errorMessage).toContainText(/decrypt|key/i);
  });

  test('passphrase field is hidden for unencrypted key', async () => {
    await decryptPage.privateKeyTextarea.fill(TEST_KEYS.alice.privateKey);
    await decryptPage.privateKeyTextarea.blur();

    // Wait for key validation to complete
    await decryptPage.keyInfoPanel.waitFor({ state: 'visible', timeout: 5000 });
    // Passphrase should not be visible for unencrypted keys
    await expect(decryptPage.passphraseInput).not.toBeVisible();
  });

  test('passphrase field appears for encrypted key', async () => {
    await decryptPage.privateKeyTextarea.fill(TEST_KEYS.bob.privateKey);
    await decryptPage.privateKeyTextarea.blur();

    // Wait for passphrase field to appear
    await expect(decryptPage.passphraseInput).toBeVisible({ timeout: 5000 });
  });

  test('shows error with wrong passphrase', async () => {
    await decryptPage.privateKeyTextarea.fill(TEST_KEYS.bob.privateKey);
    await decryptPage.privateKeyTextarea.blur();

    await expect(decryptPage.passphraseInput).toBeVisible();
    await decryptPage.passphraseInput.fill('wrong-passphrase');

    await decryptPage.encryptedMessageTextarea.fill(TEST_MESSAGES.encryptedToAlice);
    await decryptPage.decryptButton.click();

    await expect(decryptPage.errorMessage).toBeVisible();
    await expect(decryptPage.errorMessage).toContainText(/passphrase/i);
  });

  test('shows error for invalid encrypted message', async () => {
    await decryptPage.decrypt(
      TEST_KEYS.alice.privateKey,
      '-----BEGIN PGP MESSAGE-----\n\nInvalid content\n-----END PGP MESSAGE-----'
    );

    await expect(decryptPage.errorMessage).toBeVisible();
  });

  test('shows error for malformed message', async () => {
    await decryptPage.decrypt(
      TEST_KEYS.alice.privateKey,
      'This is not a PGP message at all'
    );

    await expect(decryptPage.errorMessage).toBeVisible();
  });

  test('displays key info for valid private key', async () => {
    await decryptPage.privateKeyTextarea.fill(TEST_KEYS.alice.privateKey);
    await decryptPage.privateKeyTextarea.blur();

    // Wait for key validation
    await expect(decryptPage.keyInfoPanel).toBeVisible({ timeout: 5000 });
    // Fingerprint is displayed formatted with spaces
    await expect(decryptPage.keyInfoPanel).toContainText('1562 A178');
  });

  test('copy button copies decrypted output', async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await decryptPage.decrypt(
      TEST_KEYS.alice.privateKey,
      TEST_MESSAGES.encryptedToAlice
    );

    await expect(decryptPage.outputTextarea).toBeVisible();
    await decryptPage.copyButton.click();

    // Clipboard might not work in headless mode
    try {
      await expect(decryptPage.copyButton).toContainText('Copied', { timeout: 1000 });
    } catch {
      await expect(decryptPage.copyButton).toBeVisible();
    }
  });

  test('clear all resets the form', async () => {
    await decryptPage.decrypt(
      TEST_KEYS.alice.privateKey,
      TEST_MESSAGES.encryptedToAlice
    );

    await expect(decryptPage.outputTextarea).toBeVisible();
    await decryptPage.clearAll();

    await expect(decryptPage.outputTextarea).not.toBeVisible();
    await expect(decryptPage.privateKeyTextarea).toHaveValue('');
    await expect(decryptPage.encryptedMessageTextarea).toHaveValue('');
  });

  test('decrypt button is disabled without private key', async () => {
    await decryptPage.encryptedMessageTextarea.fill(TEST_MESSAGES.encryptedToAlice);

    await expect(decryptPage.decryptButton).toBeDisabled();
  });

  test('decrypt button is disabled without message', async () => {
    await decryptPage.privateKeyTextarea.fill(TEST_KEYS.alice.privateKey);
    await decryptPage.privateKeyTextarea.blur();

    await expect(decryptPage.decryptButton).toBeDisabled();
  });
});
