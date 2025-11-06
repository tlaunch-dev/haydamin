import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react';

type NavigationDirection = 'forward' | 'back' | null;

interface NavigationContextValue {
  navigationDirection: NavigationDirection;
  getNavigationDirection: () => NavigationDirection; // Synchronous getter using ref
  setNavigationDirection: (direction: NavigationDirection) => void;
  resetNavigationDirection: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [navigationDirection, setNavigationDirectionState] = useState<NavigationDirection>(null);
  // Use a ref for synchronous reads - ensures direction is available immediately
  const directionRef = useRef<NavigationDirection>(null);

  const setNavigationDirection = useCallback((direction: NavigationDirection) => {
    directionRef.current = direction;
    setNavigationDirectionState(direction);
  }, []);

  const resetNavigationDirection = useCallback(() => {
    directionRef.current = null;
    setNavigationDirectionState(null);
  }, []);

  const getNavigationDirection = useCallback(() => {
    return directionRef.current;
  }, []);

  const value = useMemo(
    () => ({
      navigationDirection,
      getNavigationDirection,
      setNavigationDirection,
      resetNavigationDirection,
    }),
    [navigationDirection, getNavigationDirection, setNavigationDirection, resetNavigationDirection]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
