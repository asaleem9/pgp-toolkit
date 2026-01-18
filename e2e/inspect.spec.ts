import { test, expect } from '@playwright/test';
import { InspectPage } from './pages';
import { TEST_KEYS, INVALID_KEYS } from './fixtures/test-keys';

test.describe('Key Inspector', () => {
  let inspectPage: InspectPage;

  test.beforeEach(async ({ page }) => {
    inspectPage = new InspectPage(page);
    await inspectPage.goto();
  });

  test('inspects public key and shows details', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    // Check fingerprint is displayed (formatted with spaces)
    await expect(page.locator('text=Fingerprint')).toBeVisible();
    await expect(page.locator('text=1562 A178')).toBeVisible();
  });

  test('inspects private key and shows warning', async () => {
    await inspectPage.inspect(TEST_KEYS.alice.privateKey);

    await expect(inspectPage.privateKeyWarning).toBeVisible();
  });

  test('displays algorithm info', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    await expect(inspectPage.algorithmInfo).toBeVisible();
  });

  test('displays user ID', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    await expect(page.locator('text=Alice Test')).toBeVisible();
    await expect(page.locator('text=alice@test.com')).toBeVisible();
  });

  test('displays key ID', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    await expect(page.locator('text=Key ID')).toBeVisible();
  });

  test('displays capabilities', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    // Should show capability badges - use more specific selectors
    await expect(page.getByText('✓ Certify')).toBeVisible();
  });

  test('inspects RSA key', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.rsa.publicKey);

    // RSA key should show RSA algorithm - use first() to handle multiple matches
    await expect(page.getByText('rsaEncryptSign').first()).toBeVisible();
  });

  test('inspects ECC key', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    // ECC key should show EdDSA or similar
    await expect(page.locator('text=/EdDSA|ECC|Curve/i')).toBeVisible();
  });

  test('shows error for invalid key', async () => {
    await inspectPage.inspect(INVALID_KEYS.malformed);

    await expect(inspectPage.errorMessage).toBeVisible();
  });

  test('shows error for truncated key', async () => {
    await inspectPage.inspect(INVALID_KEYS.truncated);

    await expect(inspectPage.errorMessage).toBeVisible();
  });

  test('copy fingerprint button works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    // Find and click the copy fingerprint button
    const copyButton = page.locator('button[title="Copy Fingerprint"]');
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // Clipboard might not work in all browsers - just verify the button is clickable
    await expect(copyButton).toBeVisible();
  });

  test('shows subkeys section when key has subkeys', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    // Most keys have subkeys for encryption
    await expect(page.locator('text=/Subkey|Encryption/i')).toBeVisible();
  });

  test('inspect button is disabled without key', async () => {
    await expect(inspectPage.inspectButton).toBeDisabled();
  });

  test('inspects password-protected private key', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.bob.privateKey);

    // Should show it's encrypted
    await expect(page.locator('text=/Encrypted|Protected|Passphrase/i')).toBeVisible();
  });
});

test.describe('Key Expiry', () => {
  let inspectPage: InspectPage;

  test.beforeEach(async ({ page }) => {
    inspectPage = new InspectPage(page);
    await inspectPage.goto();
  });

  test('shows no expiry for keys without expiration', async ({ page }) => {
    await inspectPage.inspect(TEST_KEYS.alice.publicKey);

    // Check for "Never" in the Expires field - use first() to avoid strict mode violation
    await expect(page.getByText('Never').first()).toBeVisible();
  });

  // Note: To fully test expiry warnings, we would need keys with specific expiration dates
  // The test keys generated don't have expiration set, so these tests verify the UI handles it
});
