import { Page, Locator } from '@playwright/test';

export class InspectPage {
  readonly page: Page;
  readonly tabButton: Locator;
  readonly keyTextarea: Locator;
  readonly inspectButton: Locator;
  readonly algorithmInfo: Locator;
  readonly fingerprintInfo: Locator;
  readonly keyIdInfo: Locator;
  readonly userIdList: Locator;
  readonly capabilitiesBadges: Locator;
  readonly subkeysSection: Locator;
  readonly privateKeyWarning: Locator;
  readonly expiredIndicator: Locator;
  readonly copyFingerprintButton: Locator;
  readonly copyKeyIdButton: Locator;
  readonly errorMessage: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabButton = page.getByRole('tab', { name: 'Inspect' });
    this.keyTextarea = page.locator('#inspect-key');
    this.inspectButton = page.getByRole('button', { name: 'Inspect Key' });
    this.algorithmInfo = page.locator('text=Algorithm').locator('..');
    this.fingerprintInfo = page.locator('code').filter({ hasText: /[A-F0-9]{4}/ }).first();
    this.keyIdInfo = page.locator('text=Key ID').locator('..').locator('.font-mono');
    this.userIdList = page.locator('text=User IDs').locator('..').locator('ul');
    this.capabilitiesBadges = page.locator('text=Capabilities').locator('..');
    this.subkeysSection = page.locator('text=Subkeys');
    // Private key warning has class bg-warning/10
    this.privateKeyWarning = page.locator('text=This is a private key').locator('..').locator('..');
    this.expiredIndicator = page.locator('text=Expired');
    this.copyFingerprintButton = page.locator('button[title="Copy Fingerprint"]');
    this.copyKeyIdButton = page.locator('button[title="Copy Key ID"]');
    this.errorMessage = page.locator('[role="alert"]');
    this.clearAllButton = page.getByRole('button', { name: /Clear/ });
  }

  async goto() {
    await this.page.goto('/');
    await this.tabButton.click();
  }

  async inspect(key: string) {
    await this.keyTextarea.fill(key);
    await this.inspectButton.click();
  }

  async getFingerprint(): Promise<string> {
    return await this.fingerprintInfo.innerText();
  }

  async getKeyId(): Promise<string> {
    return await this.keyIdInfo.innerText();
  }

  async isPrivateKeyWarningVisible(): Promise<boolean> {
    return await this.privateKeyWarning.isVisible();
  }

  async hasCapability(capability: string): Promise<boolean> {
    const badges = this.page.locator(`.capability-badge:has-text("${capability}")`);
    return (await badges.count()) > 0;
  }

  async copyFingerprint() {
    await this.copyFingerprintButton.click();
  }

  async copyKeyId() {
    await this.copyKeyIdButton.click();
  }
}
