/**
 * Navigation state tracker - module-level state that persists across route changes
 * This ensures navigation direction is available immediately when components mount
 */

type NavigationDirection = 'forward' | 'back' | null;

// Module-level state - persists across React re-renders and route changes
let pendingNavigationDirection: NavigationDirection = null;

/**
 * Set the navigation direction before navigation occurs
 * This is called synchronously before navigate() is called
 */
export const setPendingNavigationDirection = (direction: NavigationDirection): void => {
  pendingNavigationDirection = direction;
};

/**
 * Get and clear the pending navigation direction
 * Called when a component mounts to check if it's a back/forward navigation
 * This is a one-time read - the value is cleared after reading
 */
export const getAndClearPendingNavigationDirection = (): NavigationDirection => {
  const direction = pendingNavigationDirection;
  pendingNavigationDirection = null; // Clear after reading
  return direction;
};

/**
 * Clear any pending navigation direction
 * Useful for cleanup or when navigation is cancelled
 */
export const clearPendingNavigationDirection = (): void => {
  pendingNavigationDirection = null;
};

