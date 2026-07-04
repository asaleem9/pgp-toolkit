import { useEffect, useRef, useState } from 'react';

const GLYPHS = '!<>-_\\/[]{}=+*^?#@$%&0123456789ABCDEF';

interface UseScrambleOptions {
  /** Total animation length in ms */
  duration?: number;
}

/**
 * Resolves `text` left-to-right out of a pool of cipher-ish glyphs, like a
 * message being decrypted. Runs once on mount; respects reduced motion by
 * rendering the final text immediately. Spaces are preserved so the layout
 * doesn't jitter.
 */
export function useScramble(text: string, { duration = 900 }: UseScrambleOptions = {}) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);
  const textRef = useRef(text);

  useEffect(() => {
    const target = textRef.current;

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setDisplay(target);
      setDone(true);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const settled = Math.floor(progress * target.length);

      let next = '';
      for (let i = 0; i < target.length; i++) {
        const ch = target[i];
        if (i < settled || ch === ' ' || ch === '\n') {
          next += ch;
        } else {
          next += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setDisplay(next);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  return { display, done };
}
