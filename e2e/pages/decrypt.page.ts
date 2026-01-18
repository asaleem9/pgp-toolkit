import { Page, Locator } from '@playwright/test';

export class DecryptPage {
  readonly page: Page;
  readonly tabButton: Locator;
  readonly privateKeyTextarea: Locator;
  readonly passphraseInput: Locator;
  readonly encryptedMessageTextarea: Locator;
  readonly decryptButton: Locator;
  readonly outputTextarea: Locator;
  readonly copyButton: Locator;
  readonly errorMessage: Locator;
  readonly keyInfoPanel: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabButton = page.getByRole('tab', { name: 'Decrypt' });
    // IDs go directly on textareas in KeyInput and MessageInput components
    this.privateKeyTextarea = page.locator('#private-key');
    this.passphraseInput = page.locator('#passphrase');
    this.encryptedMessageTextarea = page.locator('#encrypted-message');
    this.decryptButton = page.getByRole('button', { name: 'Decrypt Message' });
    this.outputTextarea = page.locator('#decrypted-output');
    this.copyButton = page.getByRole('button', { name: 'Copy to Clipboard' });
    this.errorMessage = page.locator('[role="alert"]');
    // Key info panel has ID pattern {keyId}-info
    this.keyInfoPanel = page.locator('#private-key-info');
    this.clearAllButton = page.getByRole('button', { name: 'Clear All' });
  }

  async goto() {
    await this.page.goto('/');
    await this.tabButton.click();
  }

  async decrypt(privateKey: string, encryptedMessage: string, passphrase?: string) {
    await this.privateKeyTextarea.fill(privateKey);
    await this.privateKeyTextarea.blur();

    if (passphrase) {
      await this.passphraseInput.waitFor({ state: 'visible' });
      await this.passphraseInput.fill(passphrase);
    }

    await this.encryptedMessageTextarea.fill(encryptedMessage);
    await this.decryptButton.click();
  }

  async getDecryptedOutput(): Promise<string> {
    return await this.outputTextarea.inputValue();
  }

  async isPassphraseVisible(): Promise<boolean> {
    return await this.passphraseInput.isVisible();
  }

  async clearAll() {
    await this.clearAllButton.click();
  }
}
