import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';

interface SwipeBackOptions {
  enabled?: boolean;
  threshold?: number; // Minimum swipe distance to trigger back navigation
  edgeThreshold?: number; // Maximum distance from left edge to start swipe
}

export const useSwipeBack = (options: SwipeBackOptions = {}) => {
  const {
    enabled = true,
    threshold = 100,
    edgeThreshold = 50,
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { setNavigationDirection } = useNavigation();

  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];

      // Only start if touch begins near left edge
      if (touch.clientX > edgeThreshold) {
        return;
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      swipeStartedRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Only consider right swipes that started near the edge
      if (deltaX < 10) return;

      // If swipe is more vertical than horizontal, ignore
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartRef.current = null;
        return;
      }

      // Start the swipe
      if (!swipeStartedRef.current) {
        swipeStartedRef.current = true;
        setIsSwipping(true);
      }

      // Prevent default scrolling during swipe
      e.preventDefault();

      // Calculate progress (0 to 1, capped at 1)
      const progress = Math.min(deltaX / threshold, 1);
      setSwipeProgress(progress);
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !swipeStartedRef.current) {
        touchStartRef.current = null;
        swipeStartedRef.current = false;
        setSwipeProgress(0);
        setIsSwipping(false);
        return;
      }

      // If swipe progress is sufficient, trigger back navigation
      if (swipeProgress >= 0.5) {
        setNavigationDirection('back');
        navigate(-1);
      }

      // Reset state
      touchStartRef.current = null;
      swipeStartedRef.current = false;
      setSwipeProgress(0);
      setIsSwipping(false);
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
      swipeStartedRef.current = false;
      setSwipeProgress(0);
      setIsSwipping(false);
    };

    // Add touch listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, threshold, edgeThreshold, swipeProgress, navigate, setNavigationDirection]);

  // Reset on route change
  useEffect(() => {
    setSwipeProgress(0);
    setIsSwipping(false);
    touchStartRef.current = null;
    swipeStartedRef.current = false;
  }, [location.pathname]);

  return {
    swipeProgress,
    isSwipping,
  };
};
