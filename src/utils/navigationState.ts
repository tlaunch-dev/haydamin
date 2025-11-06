/**
 * Navigation state utilities
 * Uses React Router's location state and a module-level variable for reliable navigation direction tracking
 * 
 * For back navigation, we use a module-level variable because:
 * - navigate(-1) goes to a different history entry, so we can't modify its state
 * - Module-level state persists across route changes and is available synchronously
 */

export type NavigationDirection = 'forward' | 'back' | null;

// Module-level state for back navigation
// This persists across route changes and is available immediately when components mount
let backNavigationPending: boolean = false;

/**
 * Set that a back navigation is pending
 * Called before navigate(-1) to mark that the next navigation is a back navigation
 */
export const setBackNavigationPending = (): void => {
  backNavigationPending = true;
};

/**
 * Get the pending back navigation flag (read-only)
 * Returns true if a back navigation is pending, false otherwise
 */
export const getBackNavigationPending = (): boolean => {
  return backNavigationPending;
};

/**
 * Clear the pending back navigation flag
 * Should be called after the navigation has been processed
 */
export const clearBackNavigationPending = (): void => {
  backNavigationPending = false;
};

/**
 * Get navigation direction from location state (for forward navigation)
 */
export const getNavigationDirectionFromLocation = (
  locationState: unknown
): NavigationDirection => {
  if (locationState && typeof locationState === 'object' && 'navigationDirection' in locationState) {
    return locationState.navigationDirection as NavigationDirection;
  }
  return null;
};

