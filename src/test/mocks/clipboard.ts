import { vi } from 'vitest';

export const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue(''),
};

export function setupClipboardMock() {
  Object.defineProperty(navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
    configurable: true,
  });
}

export function resetClipboardMock() {
  mockClipboard.writeText.mockClear();
  mockClipboard.readText.mockClear();
}
