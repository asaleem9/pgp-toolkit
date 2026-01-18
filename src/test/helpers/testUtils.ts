/**
 * Common test utilities and test data
 */

import { renderHook as renderHookRTL, type RenderHookResult } from '@testing-library/react';

/**
 * Common test messages with various characteristics
 */
export const TEST_MESSAGES = {
  small: 'Hello, World!',
  medium: 'This is a longer test message with multiple sentences. It should be enough to test most functionality without being too large.',
  large: 'x'.repeat(1024 * 512), // 512KB
  nearLimit: 'x'.repeat(1024 * 1024 - 10), // Just under 1MB
  atLimit: 'x'.repeat(1024 * 1024), // Exactly 1MB
  overLimit: 'x'.repeat(1024 * 1024 + 1), // Just over 1MB
  unicode: 'Hello 世界 🌍 Здравствуй мир',
  emoji: '🔐 Encrypted message with 🎉 emojis 🚀',
  specialChars: 'Message with special chars: !@#$%^&*()_+-=[]{}|;:\'",.<>?/\\',
  multiline: 'Line 1\nLine 2\nLine 3\n\nLine 5 after blank',
  empty: '',
  whitespace: '   \n\t  ',
  tabs: '\t\tIndented\twith\ttabs\t\t',
};

/**
 * Test PGP armor blocks
 */
export const TEST_PGP_BLOCKS = {
  validPublicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEaVjUcRYJKwYBBAHaRw8BAQdAjvAVYWt6g2PKj+CloVqp2lGfIKdJCPeM
tiu9JiqcwGbNG0FsaWNlIFRlc3QgPGFsaWNlQHRlc3QuY29tPg==
=test
-----END PGP PUBLIC KEY BLOCK-----`,

  validPrivateKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEaVjUcRYJKwYBBAHaRw8BAQdAjvAVYWt6g2PKj+CloVqp2lGfIKdJCPeM
tiu9JiqcwGYAAP9sWH8yC4mviPpwdxkAnQijQep5fYUCv4NrYvqVbbKF2xBG
=test
-----END PGP PRIVATE KEY BLOCK-----`,

  validMessage: `-----BEGIN PGP MESSAGE-----

wV4D7s3YJZvzdgYSAQdAOJh89gz+Wc+mnWY23IvGy5yq9omTHJNbdxBO/5TE
MSUwPR7H+rCGddtcYshmuiAyp5aONDPe5NcsJPxuWw5NwRbFdO+Xfz+ylKgD
=test
-----END PGP MESSAGE-----`,

  malformedPublicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----
This is not a valid key
-----END PGP PUBLIC KEY BLOCK-----`,

  truncatedPublicKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----
xjMEaVjU`,

  missingBeginMarker: `xjMEaVjUcRYJKwYBBAHaRw8BAQdAjvAVYWt6g2PKj+CloVqp2lGfIKdJCPeM
=test
-----END PGP PUBLIC KEY BLOCK-----`,

  missingEndMarker: `-----BEGIN PGP PUBLIC KEY BLOCK-----
xjMEaVjUcRYJKwYBBAHaRw8BAQdAjvAVYWt6g2PKj+CloVqp2lGfIKdJCPeM
=test`,

  wrongType: `-----BEGIN PGP MESSAGE-----
Some message content
-----END PGP MESSAGE-----`,
};

/**
 * Test dates for expiration testing
 */
export const TEST_DATES = {
  past: new Date('2020-01-01'),
  yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000),
  tomorrow: new Date(Date.now() + 24 * 60 * 60 * 1000),
  in3Days: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  in7Days: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  in10Days: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  in30Days: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  in90Days: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  farFuture: new Date('2030-01-01'),
};

/**
 * Create a drag event for testing drag-and-drop
 */
export function createDragEvent(
  type: 'dragenter' | 'dragleave' | 'dragover' | 'drop',
  files: File[] = []
): DragEvent {
  const event = new Event(type, { bubbles: true }) as DragEvent;

  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      types: files.length > 0 ? ['Files'] : [],
      effectAllowed: 'all',
      dropEffect: 'copy',
    },
    writable: false,
  });

  return event;
}

/**
 * Create a keyboard event for testing
 */
export function createKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  key: string,
  options: KeyboardEventInit = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    key,
    bubbles: true,
    ...options,
  });
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Wait for a specific amount of time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Render a hook with proper cleanup
 */
export function renderHook<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: { initialProps?: TProps }
): RenderHookResult<TResult, TProps> {
  return renderHookRTL(callback, options);
}

/**
 * Create a spy on console methods to suppress expected errors/warnings in tests
 */
export function suppressConsole(method: 'error' | 'warn' | 'log') {
  const original = console[method];
  console[method] = () => {};
  return () => {
    console[method] = original;
  };
}

/**
 * Generate a string of specific byte size
 */
export function generateString(sizeInBytes: number): string {
  return 'x'.repeat(sizeInBytes);
}

/**
 * Generate a Blob of specific size
 */
export function generateBlob(sizeInBytes: number, type: string = 'text/plain'): Blob {
  return new Blob([generateString(sizeInBytes)], { type });
}

/**
 * Check if a string is a valid PGP armor block
 */
export function isValidPGPArmor(text: string, type: 'PUBLIC KEY' | 'PRIVATE KEY' | 'MESSAGE'): boolean {
  const beginMarker = `-----BEGIN PGP ${type} BLOCK-----`;
  const endMarker = `-----END PGP ${type} BLOCK-----`;
  return text.includes(beginMarker) && text.includes(endMarker);
}

/**
 * Mock a successful async operation
 */
export function mockAsyncSuccess<T>(value: T, delay: number = 0): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), delay);
  });
}

/**
 * Mock a failed async operation
 */
export function mockAsyncError(error: Error | string, delay: number = 0): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(typeof error === 'string' ? new Error(error) : error), delay);
  });
}
