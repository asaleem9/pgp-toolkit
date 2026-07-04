import { useCallback, useState, ReactNode } from 'react';
import { LiveAnnouncerContext } from './liveAnnouncerContext';

/**
 * Screen-reader announcements for async outcomes (copy, encrypt done, etc.).
 * Uses role="status" (polite) — role="alert" is reserved for form errors.
 */
export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState({ message: '', nonce: 0 });

  const announce = useCallback((message: string) => {
    setAnnouncement((prev) => ({ message, nonce: prev.nonce + 1 }));
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {/* keyed so repeating the same message is re-announced */}
        <span key={announcement.nonce}>{announcement.message}</span>
      </div>
    </LiveAnnouncerContext.Provider>
  );
}
