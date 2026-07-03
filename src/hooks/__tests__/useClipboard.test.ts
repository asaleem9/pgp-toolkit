/**
 * Tests for useClipboard hook
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with copied false', () => {
    const { result } = renderHook(() => useClipboard());

    expect(result.current.copied).toBe(false);
  });

  it('should copy text using clipboard API', async () => {
    const { result } = renderHook(() => useClipboard());

    let success = false;
    await act(async () => {
      success = await result.current.copy('test text');
    });

    expect(success).toBe(true);
    expect(result.current.copied).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('should reset copied state after default delay (2000ms)', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test');
    });

    expect(result.current.copied).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('should use custom reset delay', async () => {
    const { result } = renderHook(() => useClipboard(5000));

    await act(async () => {
      await result.current.copy('test');
    });

    expect(result.current.copied).toBe(true);

    // 2 seconds should not reset
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(true);

    // 5 seconds should reset
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('should reset immediately with reset()', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test');
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.copied).toBe(false);
  });

  it('should fallback to execCommand when clipboard API fails', async () => {
    // Mock clipboard API failure
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Not allowed'));

    // jsdom 27 removed document.execCommand entirely; install one to exercise
    // the fallback path browsers still have
    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const { result } = renderHook(() => useClipboard());

    let success = false;
    await act(async () => {
      success = await result.current.copy('fallback text');
    });

    expect(success).toBe(true);
    expect(result.current.copied).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('should return false when both methods fail', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Not allowed'));
    const execCommandMock = vi.fn().mockImplementation(() => {
      throw new Error('Not supported');
    });
    document.execCommand = execCommandMock;

    const { result } = renderHook(() => useClipboard());

    let success = true;
    await act(async () => {
      success = await result.current.copy('text');
    });

    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);

    Reflect.deleteProperty(document, 'execCommand');
  });

  it('should handle empty string', async () => {
    const { result } = renderHook(() => useClipboard());

    let success = false;
    await act(async () => {
      success = await result.current.copy('');
    });

    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
  });

  it('should handle large text', async () => {
    const { result } = renderHook(() => useClipboard());
    const largeText = 'x'.repeat(10000);

    let success = false;
    await act(async () => {
      success = await result.current.copy(largeText);
    });

    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(largeText);
  });

  it('should handle unicode text', async () => {
    const { result } = renderHook(() => useClipboard());
    const unicodeText = 'Hello 世界 🌍';

    let success = false;
    await act(async () => {
      success = await result.current.copy(unicodeText);
    });

    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(unicodeText);
  });
});
