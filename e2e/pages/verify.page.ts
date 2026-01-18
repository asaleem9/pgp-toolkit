import { Page, Locator } from '@playwright/test';

export class VerifyPage {
  readonly page: Page;
  readonly tabButton: Locator;
  readonly publicKeyTextarea: Locator;
  readonly signedMessageTextarea: Locator;
  readonly verifyButton: Locator;
  readonly validResult: Locator;
  readonly invalidResult: Locator;
  readonly signedByInfo: Locator;
  readonly signedAtInfo: Locator;
  readonly originalMessage: Locator;
  readonly errorMessage: Locator;
  readonly keyInfoPanel: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabButton = page.getByRole('tab', { name: 'Verify' });
    // IDs go directly on textareas in KeyInput
    this.publicKeyTextarea = page.locator('#verify-public-key');
    this.signedMessageTextarea = page.locator('#signed-message-input');
    this.verifyButton = page.getByRole('button', { name: 'Verify Signature' });
    // Valid/invalid result containers
    this.validResult = page.locator('text=Valid Signature').locator('..');
    this.invalidResult = page.locator('text=Invalid Signature').locator('..');
    this.signedByInfo = page.locator('text=Signed By');
    this.signedAtInfo = page.locator('text=Signed On');
    // Original message is in a <pre> element inside the result
    this.originalMessage = page.locator('pre.whitespace-pre-wrap');
    this.errorMessage = page.locator('[role="alert"]');
    this.keyInfoPanel = page.locator('#verify-public-key-info');
    this.clearAllButton = page.getByRole('button', { name: /Clear All/ });
  }

  async goto() {
    await this.page.goto('/');
    await this.tabButton.click();
  }

  async verify(publicKey: string, signedMessage: string) {
    await this.publicKeyTextarea.fill(publicKey);
    await this.publicKeyTextarea.blur();
    await this.signedMessageTextarea.fill(signedMessage);
    await this.verifyButton.click();
  }

  async isValid(): Promise<boolean> {
    return await this.validResult.isVisible();
  }

  async isInvalid(): Promise<boolean> {
    return await this.invalidResult.isVisible();
  }

  async getOriginalMessage(): Promise<string> {
    // Original message is in a <pre> element, use textContent
    return await this.originalMessage.textContent() || '';
  }

  async clearAll() {
    await this.clearAllButton.click();
  }
}
