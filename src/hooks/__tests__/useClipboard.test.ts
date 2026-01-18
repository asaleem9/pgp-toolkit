/**
 * Tests for useClipboard hook
 * Target: 95%+ coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.copied).toBe(false);
    });
  });

  it('should use custom reset delay', async () => {
    const { result } = renderHook(() => useClipboard(5000));

    await act(async () => {
      await result.current.copy('test');
    });

    expect(result.current.copied).toBe(true);

    // 2 seconds should not reset
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(true);

    // 5 seconds should reset
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.copied).toBe(false);
    });
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

    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    const { result } = renderHook(() => useClipboard());

    let success = false;
    await act(async () => {
      success = await result.current.copy('fallback text');
    });

    expect(success).toBe(true);
    expect(result.current.copied).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    execCommandSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should return false when both methods fail', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('Not allowed'));
    const execCommandSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('Not supported');
    });

    const { result } = renderHook(() => useClipboard());

    let success = true;
    await act(async () => {
      success = await result.current.copy('text');
    });

    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);

    execCommandSpy.mockRestore();
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
