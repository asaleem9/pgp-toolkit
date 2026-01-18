/**
 * Mock FileReader API for testing file upload functionality
 * Provides controlled mock implementation with success/error scenarios
 */

import { vi } from 'vitest';

/**
 * Mock FileReader class
 */
export class MockFileReader {
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: number = 0;

  readAsText(file: Blob, encoding?: string): void {
    // Simulate async file reading
    setTimeout(() => {
      this.readyState = 2; // DONE
      if (this.onload) {
        this.onload({
          target: this,
          loaded: (file as any).size || 0,
          total: (file as any).size || 0,
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  readAsDataURL(file: Blob): void {
    setTimeout(() => {
      this.readyState = 2; // DONE
      if (this.onload) {
        this.onload({
          target: this,
          loaded: (file as any).size || 0,
          total: (file as any).size || 0,
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  }

  abort(): void {
    this.readyState = 2; // DONE
  }

  addEventListener(type: string, listener: EventListener): void {
    if (type === 'load' && this.onload === null) {
      this.onload = listener as (event: ProgressEvent<FileReader>) => void;
    } else if (type === 'error' && this.onerror === null) {
      this.onerror = listener as (event: ProgressEvent<FileReader>) => void;
    }
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (type === 'load') {
      this.onload = null;
    } else if (type === 'error') {
      this.onerror = null;
    }
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

/**
 * Setup FileReader mock with successful file reading
 */
export function setupFileReaderMock(fileContent: string = 'test file content') {
  const mockReader = new MockFileReader();
  mockReader.result = fileContent;

  global.FileReader = vi.fn(() => mockReader) as any;

  return mockReader;
}

/**
 * Setup FileReader mock that simulates an error
 */
export function setupFileReaderErrorMock(errorMessage: string = 'File read error') {
  const mockReader = new MockFileReader();
  mockReader.error = new DOMException(errorMessage);

  mockReader.readAsText = function (file: Blob) {
    setTimeout(() => {
      this.readyState = 2; // DONE
      if (this.onerror) {
        this.onerror({
          target: this,
          loaded: 0,
          total: (file as any).size || 0,
        } as ProgressEvent<FileReader>);
      }
    }, 0);
  };

  global.FileReader = vi.fn(() => mockReader) as any;

  return mockReader;
}

/**
 * Create a mock File object for testing
 */
export function createMockFile(
  content: string,
  fileName: string = 'test.txt',
  mimeType: string = 'text/plain'
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Create multiple mock files
 */
export function createMockFiles(
  files: Array<{ content: string; name: string; type?: string }>
): File[] {
  return files.map(({ content, name, type = 'text/plain' }) =>
    createMockFile(content, name, type)
  );
}

/**
 * Reset FileReader mock
 */
export function resetFileReaderMock() {
  vi.restoreAllMocks();
}
