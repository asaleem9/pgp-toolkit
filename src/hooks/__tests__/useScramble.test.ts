import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScramble } from '../useScramble';

describe('useScramble', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    let now = 0;
    nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        now += 100;
        setTimeout(() => cb(now), 0);
        return now;
      })
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    // Restore only our own spy — vi.restoreAllMocks() would also wipe the
    // matchMedia implementation installed by test/setup.ts
    nowSpy.mockRestore();
  });

  it('renders final text immediately when reduced motion is preferred', () => {
    const matchMediaMock = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('matchMedia', matchMediaMock);

    const { result } = renderHook(() => useScramble('SECRET'));

    expect(result.current.display).toBe('SECRET');
    expect(result.current.done).toBe(true);
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('scrambles toward the target text and settles', () => {
    const { result } = renderHook(() => useScramble('ABC', { duration: 300 }));

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.display).toBe('ABC');
    expect(result.current.done).toBe(true);
  });

  it('keeps output the same length as the target while animating', () => {
    const { result } = renderHook(() => useScramble('HELLO WORLD', { duration: 1000 }));

    act(() => {
      vi.advanceTimersToNextTimer();
    });

    expect(result.current.display).toHaveLength('HELLO WORLD'.length);
    // Spaces are preserved even before characters settle
    expect(result.current.display[5]).toBe(' ');
  });
});
