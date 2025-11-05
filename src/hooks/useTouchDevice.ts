import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device has touch capability
 * Uses media queries to detect touch devices (mobile, tablet)
 * Returns true for touch devices, false for desktop with mouse
 */
export const useTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device has touch capability
    // @media (hover: none) and (pointer: coarse) indicates a touch device
    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    
    // Also check for touch event support as fallback
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Set initial value
    setIsTouchDevice(mediaQuery.matches || hasTouchSupport);

    // Listen for changes (e.g., device rotation, external display)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches || hasTouchSupport);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return isTouchDevice;
};

