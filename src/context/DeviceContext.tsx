import { createContext, useContext, ReactNode } from 'react';
import { useTouchDevice } from '../hooks/useTouchDevice';

interface DeviceContextValue {
  isTouchDevice: boolean;
}

const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const isTouchDevice = useTouchDevice();

  return (
    <DeviceContext.Provider value={{ isTouchDevice }}>
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
