import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Person } from '../types';
import { getPersonName } from '../utils/i18n';
import { useLanguage } from '../context/LanguageContext';
import { useZoomTransition } from '../context/ZoomTransitionContext';

interface ZoomTransitionOverlayProps {
  person: Person;
  startRect: DOMRect;
  targetPersonId: string;
  showName: boolean;
  imageSrc: string;
  onNavigate: () => void;
  onPhaseChange: (phase: 'zoom-in' | 'zoom-out' | 'reveal-card') => void;
}

export const ZoomTransitionOverlay = ({
  person,
  startRect,
  targetPersonId,
  showName,
  imageSrc,
  onNavigate,
  onPhaseChange,
}: ZoomTransitionOverlayProps) => {
  const { language } = useLanguage();
  const { clearZoomTransition } = useZoomTransition();
  const hasAnimated = useRef(false);
  const isAnimating = useRef(false);

  // Store callbacks in refs to avoid re-triggering effect
  const onNavigateRef = useRef(onNavigate);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const clearZoomTransitionRef = useRef(clearZoomTransition);

  // Update refs when callbacks change
  onNavigateRef.current = onNavigate;
  onPhaseChangeRef.current = onPhaseChange;
  clearZoomTransitionRef.current = clearZoomTransition;

  // Motion values for programmatic animation control
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    // Prevent double animation - strict check
    if (hasAnimated.current || isAnimating.current) return;
    hasAnimated.current = true;
    isAnimating.current = true;

    let cancelled = false;

    const performAnimation = async () => {
      try {
        if (cancelled) return;

        // Calculate positions
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const startX = startRect.left + startRect.width / 2 - centerX;
        const startY = startRect.top + startRect.height / 2 - centerY;

        // Set initial position
        x.set(startX);
        y.set(startY);
        scale.set(1);
        opacity.set(1);

        // Phase 1: Zoom to center with scale up
        onPhaseChangeRef.current('zoom-in');

        // Run all three animations in parallel for zoom-in
        await Promise.all([
          animate(x, 0, { duration: 0.6, ease: [0.4, 0, 0.2, 1] }),
          animate(y, 0, { duration: 0.6, ease: [0.4, 0, 0.2, 1] }),
          animate(scale, 2, { duration: 0.6, ease: [0.4, 0, 0.2, 1] }),
        ]);

        if (cancelled) return;

        // Navigate to new page while at center
        onNavigateRef.current();

        // Phase 2: Zoom to new position with scale down
        // Set phase BEFORE waiting to ensure page stays hidden
        onPhaseChangeRef.current('zoom-out');

        // Wait for new page to render and get the target element position
        // Need to wait for page animations to settle to get accurate position
        await new Promise(resolve => setTimeout(resolve, 400));

        if (cancelled) return;

        // Find the target card on the new page
        const targetElement = document.querySelector(`[data-person-id="${targetPersonId}"]`);

        if (targetElement) {
          const endRect = targetElement.getBoundingClientRect();
          const endX = endRect.left + endRect.width / 2 - centerX;
          const endY = endRect.top + endRect.height / 2 - centerY;

          // Animate position - overlay stays solid during zoom-out
          await Promise.all([
            animate(x, endX, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }),
            animate(y, endY, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }),
            animate(scale, 1, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }),
          ]);
        } else {
          // Fallback: just scale down at center if target not found
          await animate(scale, 1, { duration: 0.8, ease: [0.4, 0, 0.2, 1] });
        }

        if (cancelled) return;

        // Now that we've landed, reveal the real card and remove overlay instantly
        onPhaseChangeRef.current('reveal-card');
        opacity.set(0); // Instant removal

        // Small delay before cleanup
        await new Promise(resolve => setTimeout(resolve, 100));

        if (cancelled) return;

        // Clean up - clear the zoom transition state
        clearZoomTransitionRef.current();
        isAnimating.current = false;
      } catch (error) {
        console.error('Zoom transition error:', error);
        // Clean up on error
        clearZoomTransitionRef.current();
        isAnimating.current = false;
      }
    };

    performAnimation();

    // Cleanup function - only cancel if animation hasn't started
    // Once animation is in progress, let it complete
    return () => {
      // Only cancel if we haven't started animating yet
      // This prevents React StrictMode or re-renders from cancelling mid-flight animations
      if (!isAnimating.current) {
        cancelled = true;
      }
    };
    // Empty deps array - this effect should only run once when the overlay mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen pointer-events-none z-10000">
      <motion.div
        className="absolute top-1/2 left-1/2"
        style={{
          x,
          y,
        }}
      >
        {/* Wrapper to center the content */}
        <div className="-translate-x-1/2 -translate-y-1/2">
          <motion.div
            style={{ scale, opacity }}
            className="flex flex-col items-center gap-3"
          >
            <div className="p-1 bg-background rounded-full shadow-xl">
              <img
                src={imageSrc}
                alt={getPersonName(person, language)}
                className="w-40 h-40 sm:w-44 sm:h-44 md:w-46 md:h-46 lg:w-48 lg:h-48 rounded-full object-cover"
              />
            </div>
            {showName && (
              <h3 className={`${fontClass} text-xl md:text-2xl font-semibold text-accent text-center`}>
                {getPersonName(person, language)}
              </h3>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
