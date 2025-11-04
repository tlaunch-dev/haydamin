import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Person } from '../types';

type ZoomPhase = 'zoom-in' | 'zoom-out' | 'reveal-card' | 'complete' | null;

interface ZoomTransitionState {
  person: Person;
  startRect: DOMRect;
  showName: boolean;
  imageSrc: string;
  targetPersonId: string;
  onNavigate: () => void;
}

interface ZoomTransitionContextValue {
  zoomTransition: ZoomTransitionState | null;
  zoomPhase: ZoomPhase;
  hiddenPersonId: string | null;
  startZoomTransition: (state: ZoomTransitionState) => void;
  setZoomPhase: (phase: ZoomPhase) => void;
  setHiddenPersonId: (id: string | null) => void;
  clearZoomTransition: () => void;
}

const ZoomTransitionContext = createContext<ZoomTransitionContextValue | undefined>(undefined);

export const ZoomTransitionProvider = ({ children }: { children: ReactNode }) => {
  const [zoomTransition, setZoomTransition] = useState<ZoomTransitionState | null>(null);
  const [zoomPhase, setZoomPhase] = useState<ZoomPhase>(null);
  const [hiddenPersonId, setHiddenPersonId] = useState<string | null>(null);

  const startZoomTransition = useCallback((state: ZoomTransitionState) => {
    setZoomTransition(state);
    setZoomPhase('zoom-in');
  }, []);

  const clearZoomTransition = useCallback(() => {
    setZoomTransition(null);
    setZoomPhase(null);
    setHiddenPersonId(null);
  }, []);

  return (
    <ZoomTransitionContext.Provider
      value={{
        zoomTransition,
        zoomPhase,
        hiddenPersonId,
        startZoomTransition,
        setZoomPhase,
        setHiddenPersonId,
        clearZoomTransition,
      }}
    >
      {children}
    </ZoomTransitionContext.Provider>
  );
};

export const useZoomTransition = () => {
  const context = useContext(ZoomTransitionContext);
  if (context === undefined) {
    throw new Error('useZoomTransition must be used within a ZoomTransitionProvider');
  }
  return context;
};

