import { useState, useCallback, useEffect, useRef } from 'react';

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useClipboard(resetDelay = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Don't leave a timer running into a setState after unmount
  useEffect(() => clearResetTimer, [clearResetTimer]);

  const markCopied = useCallback(() => {
    clearResetTimer();
    setCopied(true);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, resetDelay);
  }, [clearResetTimer, resetDelay]);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      markCopied();
      return true;
    } catch {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        markCopied();
        return true;
      } catch {
        return false;
      }
    }
  }, [markCopied]);

  const reset = useCallback(() => {
    clearResetTimer();
    setCopied(false);
  }, [clearResetTimer]);

  return { copied, copy, reset };
}
