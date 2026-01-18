/**
 * Tests for sanitize utilities
 * Target: 100% coverage
 */

import { describe, it, expect, vi } from 'vitest';
import {
  clearString,
  clearSensitiveData,
  createCleanupFunction,
  clearTextarea,
  clearInput,
} from '../sanitize';

describe('clearString', () => {
  it('should return an empty string', () => {
    const result = clearString('sensitive data');
    expect(result).toBe('');
  });

  it('should return empty string for already empty input', () => {
    const result = clearString('');
    expect(result).toBe('');
  });

  it('should return empty string for unicode content', () => {
    const result = clearString('Sensitive 🔐 data 世界');
    expect(result).toBe('');
  });
});

describe('clearSensitiveData', () => {
  it('should clear string fields in an object', () => {
    const data = {
      username: 'alice',
      password: 'secret123',
      email: 'alice@test.com',
    };

    clearSensitiveData(data);

    expect(data.username).toBe('');
    expect(data.password).toBe('');
    expect(data.email).toBe('');
  });

  it('should clear nested string fields', () => {
    const data = {
      user: {
        name: 'alice',
        credentials: {
          password: 'secret',
          apiKey: 'key123',
        },
      },
      session: 'token',
    };

    clearSensitiveData(data);

    expect(data.user.name).toBe('');
    expect((data.user.credentials as any).password).toBe('');
    expect((data.user.credentials as any).apiKey).toBe('');
    expect(data.session).toBe('');
  });

  it('should handle null values without error', () => {
    const data = {
      username: 'alice',
      metadata: null,
      password: 'secret',
    };

    expect(() => clearSensitiveData(data)).not.toThrow();
    expect(data.username).toBe('');
    expect(data.metadata).toBeNull();
    expect(data.password).toBe('');
  });

  it('should handle undefined values without error', () => {
    const data = {
      username: 'alice',
      optional: undefined,
      password: 'secret',
    };

    expect(() => clearSensitiveData(data)).not.toThrow();
    expect(data.username).toBe('');
    expect(data.optional).toBeUndefined();
    expect(data.password).toBe('');
  });

  it('should not modify non-string primitive values', () => {
    const data = {
      name: 'alice',
      age: 30,
      active: true,
      score: 95.5,
    };

    clearSensitiveData(data);

    expect(data.name).toBe('');
    expect(data.age).toBe(30);
    expect(data.active).toBe(true);
    expect(data.score).toBe(95.5);
  });

  it('should handle arrays of strings', () => {
    const data = {
      passwords: ['pass1', 'pass2', 'pass3'],
    };

    // Arrays are objects in JavaScript, so it will recurse into them
    clearSensitiveData(data);

    // The array object itself will be recursed into and string values cleared
    expect((data.passwords as any)[0]).toBe('');
    expect((data.passwords as any)[1]).toBe('');
    expect((data.passwords as any)[2]).toBe('');
  });

  it('should handle empty objects', () => {
    const data = {};
    expect(() => clearSensitiveData(data)).not.toThrow();
  });

  it('should handle deeply nested objects', () => {
    const data = {
      level1: {
        level2: {
          level3: {
            level4: {
              secret: 'deep secret',
            },
          },
        },
      },
    };

    clearSensitiveData(data);

    expect((data.level1.level2.level3.level4 as any).secret).toBe('');
  });
});

describe('createCleanupFunction', () => {
  it('should create a function that calls all setters with empty string', () => {
    const setter1 = vi.fn();
    const setter2 = vi.fn();
    const setter3 = vi.fn();

    const cleanup = createCleanupFunction([setter1, setter2, setter3]);
    cleanup();

    expect(setter1).toHaveBeenCalledWith('');
    expect(setter1).toHaveBeenCalledTimes(1);
    expect(setter2).toHaveBeenCalledWith('');
    expect(setter2).toHaveBeenCalledTimes(1);
    expect(setter3).toHaveBeenCalledWith('');
    expect(setter3).toHaveBeenCalledTimes(1);
  });

  it('should handle an empty setter array', () => {
    const cleanup = createCleanupFunction([]);
    expect(() => cleanup()).not.toThrow();
  });

  it('should handle a single setter', () => {
    const setter = vi.fn();
    const cleanup = createCleanupFunction([setter]);
    cleanup();

    expect(setter).toHaveBeenCalledWith('');
    expect(setter).toHaveBeenCalledTimes(1);
  });

  it('should be callable multiple times', () => {
    const setter = vi.fn();
    const cleanup = createCleanupFunction([setter]);

    cleanup();
    cleanup();
    cleanup();

    expect(setter).toHaveBeenCalledTimes(3);
  });

  it('should work with React setState functions', () => {
    let state1 = 'value1';
    let state2 = 'value2';

    const setState1 = (value: string) => {
      state1 = value;
    };
    const setState2 = (value: string) => {
      state2 = value;
    };

    const cleanup = createCleanupFunction([setState1, setState2]);
    cleanup();

    expect(state1).toBe('');
    expect(state2).toBe('');
  });
});

describe('clearTextarea', () => {
  it('should clear textarea value', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'sensitive content';

    clearTextarea(textarea);

    expect(textarea.value).toBe('');
  });

  it('should handle null textarea without error', () => {
    expect(() => clearTextarea(null)).not.toThrow();
  });

  it('should clear textarea with multiline content', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Line 1\nLine 2\nLine 3';

    clearTextarea(textarea);

    expect(textarea.value).toBe('');
  });

  it('should clear textarea with unicode content', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Unicode content: 🔐 世界';

    clearTextarea(textarea);

    expect(textarea.value).toBe('');
  });
});

describe('clearInput', () => {
  it('should clear input value', () => {
    const input = document.createElement('input');
    input.value = 'sensitive data';

    clearInput(input);

    expect(input.value).toBe('');
  });

  it('should handle null input without error', () => {
    expect(() => clearInput(null)).not.toThrow();
  });

  it('should clear password input', () => {
    const input = document.createElement('input');
    input.type = 'password';
    input.value = 'mypassword123';

    clearInput(input);

    expect(input.value).toBe('');
  });

  it('should clear input with unicode content', () => {
    const input = document.createElement('input');
    input.value = 'Unicode: 🔐 世界';

    clearInput(input);

    expect(input.value).toBe('');
  });

  it('should clear different input types', () => {
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = 'text value';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.value = 'email@test.com';

    clearInput(textInput);
    clearInput(emailInput);

    expect(textInput.value).toBe('');
    expect(emailInput.value).toBe('');
  });
});
