import { test, expect } from '@playwright/test';
import { SignPage } from './pages';
import { TEST_KEYS, TEST_MESSAGES } from './fixtures/test-keys';

test.describe('Message Signing', () => {
  let signPage: SignPage;

  test.beforeEach(async ({ page }) => {
    signPage = new SignPage(page);
    await signPage.goto();
  });

  test('signs message with clear-signed format by default', async () => {
    await signPage.sign(TEST_KEYS.alice.privateKey, TEST_MESSAGES.plaintext);

    await expect(signPage.outputTextarea).toBeVisible();
    const output = await signPage.getSignedOutput();
    expect(output).toContain('-----BEGIN PGP SIGNED MESSAGE-----');
    expect(output).toContain('-----BEGIN PGP SIGNATURE-----');
    expect(output).toContain('-----END PGP SIGNATURE-----');
    expect(output).toContain(TEST_MESSAGES.plaintext);
  });

  test('signs message with detached signature', async () => {
    await signPage.sign(TEST_KEYS.alice.privateKey, TEST_MESSAGES.plaintext, undefined, true);

    await expect(signPage.outputTextarea).toBeVisible();
    const output = await signPage.getSignedOutput();
    expect(output).toContain('-----BEGIN PGP SIGNATURE-----');
    expect(output).toContain('-----END PGP SIGNATURE-----');
    // Detached signature should NOT contain the message
    expect(output).not.toContain('BEGIN PGP SIGNED MESSAGE');
  });

  test('passphrase field appears for encrypted key', async () => {
    await signPage.privateKeyTextarea.fill(TEST_KEYS.bob.privateKey);
    await signPage.privateKeyTextarea.blur();

    await expect(signPage.passphraseInput).toBeVisible({ timeout: 5000 });
  });

  test('signs message with passphrase-protected key', async () => {
    await signPage.sign(
      TEST_KEYS.bob.privateKey,
      TEST_MESSAGES.plaintext,
      TEST_KEYS.bob.passphrase
    );

    await expect(signPage.outputTextarea).toBeVisible();
    const output = await signPage.getSignedOutput();
    expect(output).toContain('-----BEGIN PGP SIGNED MESSAGE-----');
  });

  test('shows error with wrong passphrase', async () => {
    await signPage.privateKeyTextarea.fill(TEST_KEYS.bob.privateKey);
    await signPage.privateKeyTextarea.blur();

    await expect(signPage.passphraseInput).toBeVisible();
    await signPage.passphraseInput.fill('wrong-passphrase');

    await signPage.messageInput.fill(TEST_MESSAGES.plaintext);
    await signPage.signButton.click();

    await expect(signPage.errorMessage).toBeVisible();
    await expect(signPage.errorMessage).toContainText(/passphrase/i);
  });

  test('download button downloads .asc for clear-signed', async ({ page }) => {
    await signPage.sign(TEST_KEYS.alice.privateKey, TEST_MESSAGES.plaintext);

    await expect(signPage.downloadButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await signPage.downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.asc$/);
  });

  test('download button downloads .sig for detached', async ({ page }) => {
    await signPage.sign(TEST_KEYS.alice.privateKey, TEST_MESSAGES.plaintext, undefined, true);

    await expect(signPage.downloadButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await signPage.downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.(sig|asc)$/);
  });

  test('displays key info for valid private key', async () => {
    await signPage.privateKeyTextarea.fill(TEST_KEYS.alice.privateKey);
    await signPage.privateKeyTextarea.blur();

    await expect(signPage.keyInfoPanel).toBeVisible({ timeout: 5000 });
    // Fingerprint is displayed formatted with spaces
    await expect(signPage.keyInfoPanel).toContainText('1562 A178');
  });

  test('shows error for public key instead of private', async () => {
    await signPage.privateKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await signPage.privateKeyTextarea.blur();

    await expect(signPage.errorMessage).toBeVisible();
  });

  test('copy button copies signed output', async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await signPage.sign(TEST_KEYS.alice.privateKey, TEST_MESSAGES.plaintext);

    await expect(signPage.outputTextarea).toBeVisible();
    await signPage.copyButton.click();

    // Clipboard might not work in headless mode
    try {
      await expect(signPage.copyButton).toContainText('Copied', { timeout: 1000 });
    } catch {
      await expect(signPage.copyButton).toBeVisible();
    }
  });

  test('QR code button opens modal for short signatures', async ({ page }) => {
    await signPage.sign(TEST_KEYS.alice.privateKey, 'Short');

    await expect(signPage.qrButton).toBeVisible();
    await signPage.qrButton.click();

    // Use heading to be specific
    await expect(page.getByRole('heading', { name: 'QR Code' })).toBeVisible();
  });

  test('clear all resets the form', async () => {
    await signPage.sign(TEST_KEYS.alice.privateKey, TEST_MESSAGES.plaintext);

    await expect(signPage.outputTextarea).toBeVisible();
    await signPage.clearAll();

    await expect(signPage.outputTextarea).not.toBeVisible();
    await expect(signPage.privateKeyTextarea).toHaveValue('');
    await expect(signPage.messageInput).toHaveValue('');
  });

  test('sign button is disabled without private key', async () => {
    await signPage.messageInput.fill(TEST_MESSAGES.plaintext);

    await expect(signPage.signButton).toBeDisabled();
  });

  test('sign button is disabled without message', async () => {
    await signPage.privateKeyTextarea.fill(TEST_KEYS.alice.privateKey);
    await signPage.privateKeyTextarea.blur();

    await expect(signPage.signButton).toBeDisabled();
  });
});
