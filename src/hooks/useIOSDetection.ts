import { useMemo } from 'react';

/**
 * Hook to detect iOS devices using feature detection (not user agent sniffing)
 *
 * Uses multiple signals to reliably detect iOS:
 * - Touch support (ontouchstart in window)
 * - iOS-specific Gesture Events API
 * - Fallback to UA string for edge cases (newer iPads report as Mac)
 *
 * @returns Object with iOS detection flags and helper values
 */
export function useIOSDetection() {
  const detection = useMemo(() => {
    // Check for touch support
    const isTouchDevice = 'ontouchstart' in window;

    // Check for iOS-specific GestureEvent API
    const hasGestureEvents = 'GestureEvent' in window;

    // Fallback UA check for edge cases (e.g., iPad in desktop mode)
    const uaCheck = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Combine signals for reliable detection
    const isIOS = (isTouchDevice && hasGestureEvents) || uaCheck;

    // Detect if running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;

    return {
      isIOS,
      isStandalone,
      isTouchDevice,
      // Helper for safe area insets
      hasSafeArea: isIOS && CSS.supports('padding-top: env(safe-area-inset-top)'),
    };
  }, []);

  return detection;
}

/**
 * CSS helper to generate safe area styles for iOS
 *
 * @example
 * const style = getIOSSafeAreaStyles({
 *   top: '1rem',
 *   bottom: '1.5rem',
 *   fallback: true
 * });
 */
export function getIOSSafeAreaStyles(config: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  fallback?: boolean;
}) {
  const { top, bottom, left, right, fallback = true } = config;
  const styles: Record<string, string> = {};

  if (top) {
    styles.paddingTop = fallback
      ? `calc(${top} + env(safe-area-inset-top))`
      : `env(safe-area-inset-top)`;
  }
  if (bottom) {
    styles.paddingBottom = fallback
      ? `calc(${bottom} + env(safe-area-inset-bottom))`
      : `env(safe-area-inset-bottom)`;
  }
  if (left) {
    styles.paddingLeft = fallback
      ? `calc(${left} + env(safe-area-inset-left))`
      : `env(safe-area-inset-left)`;
  }
  if (right) {
    styles.paddingRight = fallback
      ? `calc(${right} + env(safe-area-inset-right))`
      : `env(safe-area-inset-right)`;
  }

  return styles;
}
