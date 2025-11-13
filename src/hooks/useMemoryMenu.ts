import { useState, useRef, useEffect } from 'react';

interface UseMemoryMenuProps {
  isExpanded: boolean;
}

/**
 * Hook to manage menu state and interactions (long press, click outside)
 * Handles beta unlock feature via long press
 */
export const useMemoryMenu = ({ isExpanded }: UseMemoryMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [betaUnlocked, setBetaUnlocked] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressOccurredRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const longPressDuration = 500; // 500ms for long press

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside as any);
      };
    }
  }, [isMenuOpen]);

  // Setup long press handler for menu button
  useEffect(() => {
    const button = menuButtonRef.current;
    if (!button || isExpanded) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
      longPressOccurredRef.current = false;
      touchStartTimeRef.current = Date.now();

      longPressTimerRef.current = setTimeout(() => {
        longPressOccurredRef.current = true;
        setBetaUnlocked(true); // Unlock beta features (vault) on long press
        setIsMenuOpen(true);

        // Provide haptic feedback on mobile if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, longPressDuration);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation();
      const pressDuration = Date.now() - touchStartTimeRef.current;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // If it was a long press, prevent the normal click
      if (pressDuration >= longPressDuration) {
        e.preventDefault();
        e.stopPropagation();
      }

      // For short press, let the onClick handler open the menu
      // Don't open it here to avoid conflict with onClick toggle

      setTimeout(() => {
        longPressOccurredRef.current = false;
      }, 100);
    };

    const handleTouchCancel = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    // Use native event listeners with passive: false for better control
    button.addEventListener('touchstart', handleTouchStart, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: false });
    button.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchend', handleTouchEnd);
      button.removeEventListener('touchcancel', handleTouchCancel);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [isExpanded]);

  // Handle regular click (for desktop/mouse and mobile short press)
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    // Prevent normal toggle if long press occurred
    if (longPressOccurredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    // Regular click - show menu without beta features
    setBetaUnlocked(false);
    setIsMenuOpen(!isMenuOpen);
  };

  return {
    isMenuOpen,
    setIsMenuOpen,
    betaUnlocked,
    menuRef,
    menuButtonRef,
    handleMenuButtonClick,
  };
};

