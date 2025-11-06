/**
 * Navigation state utilities
 * Uses React Router's location state and browser history state for reliable navigation direction tracking
 */

export type NavigationDirection = 'forward' | 'back' | null;

/**
 * Get navigation direction from location state (for forward navigation)
 * or from browser history state (for back navigation)
 */
export const getNavigationDirectionFromLocation = (
  locationState: unknown
): NavigationDirection => {
  if (locationState && typeof locationState === 'object' && 'navigationDirection' in locationState) {
    return locationState.navigationDirection as NavigationDirection;
  }
  return null;
};

/**
 * Get navigation direction from browser history state
 * Used for back navigation when React Router location state isn't available
 */
export const getNavigationDirectionFromHistory = (): NavigationDirection => {
  if (typeof window !== 'undefined' && window.history?.state) {
    const state = window.history.state as { navigationDirection?: NavigationDirection };
    return state?.navigationDirection || null;
  }
  return null;
};

