import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Person } from '../types';
import { getPersonName } from '../utils/i18n';
import { useLanguage } from '../context/LanguageContext';

interface ZoomTransitionOverlayProps {
  person: Person;
  startRect: DOMRect;
  targetPersonId: string;
  showName: boolean;
  imageSrc: string;
  onPhaseChange: (phase: 'zoom-in' | 'zoom-out' | 'reveal-card' | 'complete') => void;
}

export const ZoomTransitionOverlay = ({
  person,
  startRect,
  targetPersonId,
  showName,
  imageSrc,
  onPhaseChange,
}: ZoomTransitionOverlayProps) => {
  const { language } = useLanguage();
  const hasAnimated = useRef(false);

  // Motion values for programmatic animation control
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const performAnimation = async () => {
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
      onPhaseChange('zoom-in');

      // Run all three animations in parallel for zoom-in
      await Promise.all([
        animate(x, 0, { duration: 0.6, ease: [0.4, 0, 0.2, 1] }),
        animate(y, 0, { duration: 0.6, ease: [0.4, 0, 0.2, 1] }),
        animate(scale, 2, { duration: 0.6, ease: [0.4, 0, 0.2, 1] }),
      ]);

      // Small pause at center + wait for new page to render
      await new Promise(resolve => setTimeout(resolve, 150));

      // Phase 2: Zoom to new position with scale down
      onPhaseChange('zoom-out');

      // Wait a bit more for the DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 50));

      // Find the target card on the new page
      const targetElement = document.querySelector(`[data-person-id="${targetPersonId}"]`);

      if (targetElement) {
        const endRect = targetElement.getBoundingClientRect();
        const endX = endRect.left + endRect.width / 2 - centerX;
        const endY = endRect.top + endRect.height / 2 - centerY;

        await Promise.all([
          animate(x, endX, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }),
          animate(y, endY, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }),
          animate(scale, 1, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }),
        ]);
      } else {
        // Fallback: just scale down at center if target not found
        await animate(scale, 1, { duration: 0.8, ease: [0.4, 0, 0.2, 1] });
      }

      // Reveal the card and remove overlay at the exact same time
      onPhaseChange('reveal-card');
      opacity.set(0);

      // Small delay before cleanup
      await new Promise(resolve => setTimeout(resolve, 50));

      // Clean up
      onPhaseChange('complete');
    };

    performAnimation();
  }, [startRect, targetPersonId, x, y, scale, opacity, onPhaseChange]);

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          x,
          y,
        }}
      >
        {/* Wrapper to center the content */}
        <div style={{ transform: 'translate(-50%, -50%)' }}>
          <motion.div
            style={{ scale, opacity }}
            className="flex flex-col items-center gap-3"
          >
            <div className="p-1 bg-background rounded-full shadow-xl">
              <img
                src={imageSrc}
                alt={getPersonName(person, language)}
                className="w-40 h-40 sm:w-44 sm:h-44 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full object-cover"
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
