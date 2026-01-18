import { Page, Locator } from '@playwright/test';

export class EncryptPage {
  readonly page: Page;
  readonly tabButton: Locator;
  readonly publicKeyTextarea: Locator;
  readonly messageInput: Locator;
  readonly encryptButton: Locator;
  readonly outputTextarea: Locator;
  readonly copyButton: Locator;
  readonly downloadButton: Locator;
  readonly qrButton: Locator;
  readonly addRecipientButton: Locator;
  readonly encryptToSelfCheckbox: Locator;
  readonly selfKeyTextarea: Locator;
  readonly errorMessage: Locator;
  readonly keyInfoPanel: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabButton = page.getByRole('tab', { name: 'Encrypt' });
    // Recipient IDs are random UUIDs, so we find textareas by ID pattern
    this.publicKeyTextarea = page.locator('textarea[id^="public-key-"]').first();
    this.messageInput = page.locator('#plaintext-message');
    this.encryptButton = page.getByRole('button', { name: 'Encrypt Message' });
    this.outputTextarea = page.locator('#encrypted-output');
    this.copyButton = page.getByRole('button', { name: 'Copy to Clipboard' });
    this.downloadButton = page.getByRole('button', { name: 'Download as .asc' });
    this.qrButton = page.getByRole('button', { name: 'Show QR Code' });
    this.addRecipientButton = page.getByRole('button', { name: 'Add Another Recipient' });
    this.encryptToSelfCheckbox = page.getByLabel('Also encrypt to my key');
    this.selfKeyTextarea = page.locator('#self-public-key');
    this.errorMessage = page.locator('[role="alert"]');
    // Key info panel has bg-gray-50 class in KeyInput component
    this.keyInfoPanel = page.locator('[id$="-info"]').first();
    this.clearAllButton = page.getByRole('button', { name: 'Clear All & Start Over' });
  }

  async goto() {
    await this.page.goto('/');
    await this.tabButton.click();
  }

  async encrypt(publicKey: string, message: string) {
    await this.publicKeyTextarea.fill(publicKey);
    await this.publicKeyTextarea.blur();
    await this.messageInput.fill(message);
    await this.encryptButton.click();
  }

  async addRecipient() {
    await this.addRecipientButton.click();
  }

  async getRecipientTextarea(index: number): Promise<Locator> {
    // Recipient IDs are random UUIDs, so we find by nth textarea
    return this.page.locator('textarea[id^="public-key-"]').nth(index);
  }

  async enableEncryptToSelf(selfKey: string) {
    await this.encryptToSelfCheckbox.check();
    await this.selfKeyTextarea.fill(selfKey);
    await this.selfKeyTextarea.blur();
  }

  async getEncryptedOutput(): Promise<string> {
    return await this.outputTextarea.inputValue();
  }

  async clearAll() {
    await this.clearAllButton.click();
  }
}
