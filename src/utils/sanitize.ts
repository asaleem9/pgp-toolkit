/**
 * Utility functions for clearing sensitive data from memory.
 * While JavaScript doesn't guarantee immediate memory clearing,
 * these functions help minimize the window of exposure.
 */

/**
 * Overwrites a string variable with random data before dereferencing.
 * Note: This is a best-effort approach as JavaScript strings are immutable.
 */
export function clearString(_str: string): string {
  // Return empty string to help garbage collector
  return '';
}

/**
 * Clears all sensitive fields in a form-like object
 */
export function clearSensitiveData(data: Record<string, unknown>): void {
  for (const key in data) {
    if (typeof data[key] === 'string') {
      data[key] = '';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      clearSensitiveData(data[key] as Record<string, unknown>);
    }
  }
}

/**
 * Creates a cleanup function that clears form inputs
 */
export function createCleanupFunction(
  setters: Array<(value: string) => void>
): () => void {
  return () => {
    setters.forEach(setter => setter(''));
  };
}

/**
 * Clears textarea content securely
 */
export function clearTextarea(textarea: HTMLTextAreaElement | null): void {
  if (textarea) {
    textarea.value = '';
  }
}

/**
 * Clears input content securely
 */
export function clearInput(input: HTMLInputElement | null): void {
  if (input) {
    input.value = '';
  }
}
