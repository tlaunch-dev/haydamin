import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

interface HiddenModeContextType {
  showNames: boolean;
  toggleShowNames: () => void;
}

const HiddenModeContext = createContext<HiddenModeContextType | undefined>(undefined);

const SHOW_NAMES_STORAGE_KEY = 'haydamin_show_names';

export function HiddenModeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage, default to true (names shown)
  const [showNames, setShowNames] = useState<boolean>(() => {
    const stored = localStorage.getItem(SHOW_NAMES_STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  // Persist to localStorage whenever showNames changes
  useEffect(() => {
    localStorage.setItem(SHOW_NAMES_STORAGE_KEY, String(showNames));
  }, [showNames]);

  const toggleShowNames = useCallback(() => {
    setShowNames((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ showNames, toggleShowNames }),
    [showNames, toggleShowNames]
  );

  return (
    <HiddenModeContext.Provider value={value}>
      {children}
    </HiddenModeContext.Provider>
  );
}

export function useHiddenMode() {
  const context = useContext(HiddenModeContext);
  if (context === undefined) {
    throw new Error('useHiddenMode must be used within a HiddenModeProvider');
  }
  return context;
}

