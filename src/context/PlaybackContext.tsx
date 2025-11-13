import { createContext, useContext, useState, ReactNode } from 'react';

interface PlaybackContextType {
  playingMemoryId: string | null;
  setPlayingMemoryId: (id: string | null) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [playingMemoryId, setPlayingMemoryId] = useState<string | null>(null);

  return (
    <PlaybackContext.Provider value={{ playingMemoryId, setPlayingMemoryId }}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback(): PlaybackContextType {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}

