import { createContext } from 'react';

export const LiveAnnouncerContext = createContext<(message: string) => void>(() => {});
