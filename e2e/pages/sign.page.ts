import { Page, Locator } from '@playwright/test';

export class SignPage {
  readonly page: Page;
  readonly tabButton: Locator;
  readonly privateKeyTextarea: Locator;
  readonly passphraseInput: Locator;
  readonly messageInput: Locator;
  readonly signButton: Locator;
  readonly outputTextarea: Locator;
  readonly copyButton: Locator;
  readonly downloadButton: Locator;
  readonly qrButton: Locator;
  readonly clearsignedRadio: Locator;
  readonly detachedRadio: Locator;
  readonly errorMessage: Locator;
  readonly keyInfoPanel: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabButton = page.getByRole('tab', { name: 'Sign' });
    // IDs go directly on textareas in KeyInput and MessageInput components
    this.privateKeyTextarea = page.locator('#private-key');
    this.passphraseInput = page.locator('#passphrase');
    this.messageInput = page.locator('#message-to-sign');
    this.signButton = page.getByRole('button', { name: 'Sign Message' });
    this.outputTextarea = page.locator('#signed-output');
    this.copyButton = page.getByRole('button', { name: 'Copy to Clipboard' });
    this.downloadButton = page.getByRole('button', { name: /Download as/ });
    this.qrButton = page.getByRole('button', { name: 'Show QR Code' });
    // Radio buttons - click the label text for reliable selection
    this.clearsignedRadio = page.getByText('Clear-signed message', { exact: true });
    this.detachedRadio = page.getByText('Detached signature', { exact: true });
    this.errorMessage = page.locator('[role="alert"]');
    this.keyInfoPanel = page.locator('#private-key-info');
    this.clearAllButton = page.getByRole('button', { name: /Clear All/ });
  }

  async goto() {
    await this.page.goto('/');
    await this.tabButton.click();
  }

  async sign(privateKey: string, message: string, passphrase?: string, detached = false) {
    await this.privateKeyTextarea.fill(privateKey);
    await this.privateKeyTextarea.blur();

    if (passphrase) {
      await this.passphraseInput.waitFor({ state: 'visible' });
      await this.passphraseInput.fill(passphrase);
    }

    if (detached) {
      await this.detachedRadio.click();
    } else {
      await this.clearsignedRadio.click();
    }

    await this.messageInput.fill(message);
    await this.signButton.click();
  }

  async getSignedOutput(): Promise<string> {
    return await this.outputTextarea.inputValue();
  }

  async clearAll() {
    await this.clearAllButton.click();
  }
}
