import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

type NavigationDirection = 'forward' | 'back' | null;

interface NavigationContextValue {
  navigationDirection: NavigationDirection;
  setNavigationDirection: (direction: NavigationDirection) => void;
  resetNavigationDirection: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [navigationDirection, setNavigationDirectionState] = useState<NavigationDirection>(null);

  const setNavigationDirection = useCallback((direction: NavigationDirection) => {
    setNavigationDirectionState(direction);
  }, []);

  const resetNavigationDirection = useCallback(() => {
    setNavigationDirectionState(null);
  }, []);

  const value = useMemo(
    () => ({
      navigationDirection,
      setNavigationDirection,
      resetNavigationDirection,
    }),
    [navigationDirection, setNavigationDirection, resetNavigationDirection]
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
