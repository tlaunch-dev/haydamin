import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useTouchDevice } from '../hooks/useTouchDevice';

interface DeviceContextValue {
  isTouchDevice: boolean;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const isTouchDevice = useTouchDevice();

  const value = useMemo(
    () => ({ isTouchDevice }),
    [isTouchDevice]
  );

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return ctx;
}
