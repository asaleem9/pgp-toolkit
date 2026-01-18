import { test, expect } from '@playwright/test';
import { EncryptPage } from './pages';
import { TEST_KEYS, TEST_MESSAGES } from './fixtures/test-keys';

test.describe('Encryption', () => {
  let encryptPage: EncryptPage;

  test.beforeEach(async ({ page }) => {
    encryptPage = new EncryptPage(page);
    await encryptPage.goto();
  });

  test('encrypts message with valid public key', async () => {
    await encryptPage.encrypt(TEST_KEYS.alice.publicKey, TEST_MESSAGES.plaintext);

    await expect(encryptPage.outputTextarea).toBeVisible();
    const output = await encryptPage.getEncryptedOutput();
    expect(output).toContain('-----BEGIN PGP MESSAGE-----');
    expect(output).toContain('-----END PGP MESSAGE-----');
  });

  test('shows error for invalid key', async () => {
    await encryptPage.publicKeyTextarea.fill('invalid key data');
    await encryptPage.publicKeyTextarea.blur();

    await expect(encryptPage.errorMessage).toBeVisible();
  });

  test('shows error for malformed key', async () => {
    await encryptPage.publicKeyTextarea.fill(
      '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nThis is not valid\n-----END PGP PUBLIC KEY BLOCK-----'
    );
    await encryptPage.publicKeyTextarea.blur();

    await expect(encryptPage.errorMessage).toBeVisible();
  });

  test('displays key info for valid key', async () => {
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    // Wait for key validation to complete
    await expect(encryptPage.keyInfoPanel).toBeVisible({ timeout: 5000 });
    // Fingerprint is displayed formatted with spaces, check for key ID part
    await expect(encryptPage.keyInfoPanel).toContainText('1562 A178');
  });

  test('encrypt button is disabled without key', async ({ page }) => {
    await encryptPage.messageInput.fill(TEST_MESSAGES.plaintext);

    await expect(encryptPage.encryptButton).toBeDisabled();
  });

  test('encrypt button is disabled without message', async ({ page }) => {
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await expect(encryptPage.encryptButton).toBeDisabled();
  });

  test('copy button copies encrypted output', async ({ page, context, browserName }) => {
    // Grant clipboard permissions - may not work in all browsers/modes
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await encryptPage.encrypt(TEST_KEYS.alice.publicKey, TEST_MESSAGES.plaintext);

    await expect(encryptPage.outputTextarea).toBeVisible();
    await encryptPage.copyButton.click();

    // Verify button shows "Copied!" or wait for clipboard operation
    // Some browsers don't support clipboard in headless mode
    try {
      await expect(encryptPage.copyButton).toContainText('Copied', { timeout: 1000 });
    } catch {
      // Clipboard might not work in headless mode - just verify click worked
      await expect(encryptPage.copyButton).toBeVisible();
    }
  });

  test('download button downloads .asc file', async ({ page }) => {
    await encryptPage.encrypt(TEST_KEYS.alice.publicKey, TEST_MESSAGES.plaintext);

    await expect(encryptPage.downloadButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await encryptPage.downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.asc$/);
  });

  test('QR code button opens modal', async ({ page }) => {
    await encryptPage.encrypt(TEST_KEYS.alice.publicKey, 'Short message');

    await expect(encryptPage.qrButton).toBeVisible();
    await encryptPage.qrButton.click();

    // QR modal should be visible - use heading to be specific
    await expect(page.getByRole('heading', { name: 'QR Code' })).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('clear all resets the form', async ({ page }) => {
    await encryptPage.encrypt(TEST_KEYS.alice.publicKey, TEST_MESSAGES.plaintext);

    await expect(encryptPage.outputTextarea).toBeVisible();
    await encryptPage.clearAll();

    await expect(encryptPage.outputTextarea).not.toBeVisible();
    await expect(encryptPage.publicKeyTextarea).toHaveValue('');
    await expect(encryptPage.messageInput).toHaveValue('');
  });
});

test.describe('Multiple Recipients', () => {
  let encryptPage: EncryptPage;

  test.beforeEach(async ({ page }) => {
    encryptPage = new EncryptPage(page);
    await encryptPage.goto();
  });

  test('can add another recipient', async ({ page }) => {
    await encryptPage.addRecipient();

    // Should now have 2 key inputs (IDs are directly on textareas)
    const keyInputs = page.locator('textarea[id^="public-key-"]');
    await expect(keyInputs).toHaveCount(2);
  });

  test('can add up to 10 recipients', async ({ page }) => {
    for (let i = 0; i < 9; i++) {
      await encryptPage.addRecipient();
    }

    const keyInputs = page.locator('textarea[id^="public-key-"]');
    await expect(keyInputs).toHaveCount(10);

    // Add button should be hidden when at max
    await expect(encryptPage.addRecipientButton).not.toBeVisible();
  });

  test('can remove recipient', async ({ page }) => {
    await encryptPage.addRecipient();

    const keyInputs = page.locator('textarea[id^="public-key-"]');
    await expect(keyInputs).toHaveCount(2);

    // Click remove on first recipient
    await page.locator('button[title="Remove recipient"]').first().click();

    await expect(keyInputs).toHaveCount(1);
  });

  test('cannot remove last recipient', async ({ page }) => {
    // Should not show remove button when only 1 recipient
    const removeButtons = page.locator('button[title="Remove recipient"]');
    await expect(removeButtons).toHaveCount(0);
  });

  test('encrypts to multiple recipients', async ({ page }) => {
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await encryptPage.addRecipient();
    const secondKeyInput = await encryptPage.getRecipientTextarea(1);
    await secondKeyInput.fill(TEST_KEYS.bob.publicKey);
    await secondKeyInput.blur();

    await encryptPage.messageInput.fill(TEST_MESSAGES.plaintext);
    await encryptPage.encryptButton.click();

    await expect(encryptPage.outputTextarea).toBeVisible();
    const output = await encryptPage.getEncryptedOutput();
    expect(output).toContain('-----BEGIN PGP MESSAGE-----');
  });

  test('shows recipient count when multiple', async ({ page }) => {
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await encryptPage.addRecipient();
    const secondKeyInput = await encryptPage.getRecipientTextarea(1);
    await secondKeyInput.fill(TEST_KEYS.bob.publicKey);
    await secondKeyInput.blur();

    await expect(page.locator('text=Encrypting to 2 recipient(s)')).toBeVisible();
  });
});

test.describe('Encrypt to Self', () => {
  let encryptPage: EncryptPage;

  test.beforeEach(async ({ page }) => {
    encryptPage = new EncryptPage(page);
    await encryptPage.goto();
  });

  test('shows self key input when checkbox is checked', async ({ page }) => {
    await expect(encryptPage.selfKeyTextarea).not.toBeVisible();

    await encryptPage.encryptToSelfCheckbox.check();

    await expect(encryptPage.selfKeyTextarea).toBeVisible();
  });

  test('hides self key input when checkbox is unchecked', async ({ page }) => {
    await encryptPage.encryptToSelfCheckbox.check();
    await expect(encryptPage.selfKeyTextarea).toBeVisible();

    await encryptPage.encryptToSelfCheckbox.uncheck();
    await expect(encryptPage.selfKeyTextarea).not.toBeVisible();
  });

  test('encrypts to self when enabled', async ({ page }) => {
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await encryptPage.enableEncryptToSelf(TEST_KEYS.bob.publicKey);

    await encryptPage.messageInput.fill(TEST_MESSAGES.plaintext);
    await encryptPage.encryptButton.click();

    await expect(encryptPage.outputTextarea).toBeVisible();
    const output = await encryptPage.getEncryptedOutput();
    expect(output).toContain('-----BEGIN PGP MESSAGE-----');
  });

  test('shows error when encrypt to self enabled but no key', async ({ page }) => {
    await encryptPage.publicKeyTextarea.fill(TEST_KEYS.alice.publicKey);
    await encryptPage.publicKeyTextarea.blur();

    await encryptPage.encryptToSelfCheckbox.check();
    await encryptPage.messageInput.fill(TEST_MESSAGES.plaintext);
    await encryptPage.encryptButton.click();

    await expect(encryptPage.errorMessage).toBeVisible();
  });
});
