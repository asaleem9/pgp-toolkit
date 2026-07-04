import { useContext } from 'react';
import { LiveAnnouncerContext } from '../components/liveAnnouncerContext';

/** Post a polite screen-reader announcement (copy, encrypt done, etc.). */
export function useAnnounce() {
  return useContext(LiveAnnouncerContext);
}
