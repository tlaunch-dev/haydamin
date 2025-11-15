import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import '../styles/plyr-custom.css';
import { Memory, Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getTimeAgo } from '../utils/dateUtils';
import { refreshVideoUrl } from '../services/storage';
import { useIOSDetection } from '../hooks/useIOSDetection';



interface MemoryVideoPanelProps {
  memory: Memory | null;
  people: Person[];
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function MemoryVideoPanel({
  memory,
  people,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}: MemoryVideoPanelProps) {
  const { language } = useLanguage();
  const { isIOS } = useIOSDetection();
  const plyrRef = useRef<any>(null);

  // Simplified state - Plyr handles most playback state internally
  const [hasError, setHasError] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');

  // Video aspect ratio - use stored value if available
  const videoAspectRatio = memory?.videoAspectRatio || 16 / 9;
  const isVerticalVideo = videoAspectRatio < 1;

  // Reset video URL when memory changes
  useEffect(() => {
    if (memory) {
      setCurrentVideoUrl(memory.videoUrl);
      setHasError(false);
    }
  }, [memory?.id]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard shortcuts for navigation (Plyr handles video controls)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (e.shiftKey) { // Shift+Left for previous video
            e.preventDefault();
            onPrevious?.();
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) { // Shift+Right for next video
            e.preventDefault();
            onNext?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  // Early return after all hooks have been called
  if (!memory) return null;

  // Localized content
  const title = language === 'ar' ? memory.titleAr : memory.title;
  const caption = language === 'ar' ? memory.captionAr : memory.caption;
  const dateStr = getTimeAgo(memory.dateRecorded, language);

  // Get people in this memory
  const memoryPeople = (memory.people || [])
    .map((personId: string) => people.find((p: Person) => p.id === personId))
    .filter((p): p is Person => p !== undefined);

  // Plyr configuration - minimal controls
  const plyrOptions = {
    autoplay: true,
    muted: true,
    clickToPlay: true, // Tap anywhere to play/pause
    hideControls: false,
    controls: [
      'play-large', // Big play button in center when paused
      'mute', // Unmute button for iOS autoplay
      'fullscreen', // Fullscreen toggle
    ],
    fullscreen: {
      enabled: true,
      fallback: true,
      iosNative: true, // Use native iOS fullscreen
    },
  };

  const plyrSource = {
    type: 'video' as const,
    sources: [
      {
        src: currentVideoUrl,
        type: 'video/mp4',
      },
    ],
    poster: memory.thumbnailUrl,
  };

  const handleRetry = async () => {
    try {
      const freshUrl = await refreshVideoUrl(memory.videoUrl);
      setCurrentVideoUrl(freshUrl);
      setHasError(false);
    } catch (error) {
      console.error('[VIDEO PANEL] URL refresh failed:', error);
    }
  };

  return (
    <>
      {/* Background Dimmer */}
      <motion.div
        className="fixed inset-0 bg-black z-40"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isOpen ? 0.6 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: 0.3 }}
      />

      {/* Video Panel - Use dvh for better iOS Safari compatibility */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl flex flex-col"
        style={{
          // Use dvh (dynamic viewport height) for better iOS Safari compatibility
          // Reserve space for close button (top) and safe areas
          maxHeight: isIOS 
            ? 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
            : '90dvh',
          height: isIOS 
            ? 'calc(100dvh - env(safe-area-inset-bottom))'
            : '90dvh',
          // Ensure panel uses flex layout
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Prevent panel overflow, content scrolls internally
          // iOS-specific: smooth scrolling
          ...(isIOS && {
            WebkitOverflowScrolling: 'touch',
          }),
        }}
        initial={{ y: '100%' }}
        animate={{
          y: isOpen ? 0 : '100%',
        }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
      >
        {/* Close Button - Fixed position, always visible */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-text/80 text-accent-text flex items-center justify-center hover:bg-text transition-colors"
          style={{
            // Account for safe area on iOS
            top: isIOS ? 'calc(1rem + env(safe-area-inset-top))' : '1rem',
            right: isIOS ? 'calc(1rem + env(safe-area-inset-right))' : '1rem',
          }}
          aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Container - Flex layout with reserved caption space */}
        <div 
          className="px-4 pt-2 flex flex-col flex-1 min-h-0"
          style={{
            // iOS-specific: smooth scrolling
            ...(isIOS && {
              WebkitOverflowScrolling: 'touch',
            }),
            // Reserve space for close button at top
            paddingTop: isIOS ? 'calc(3.5rem + env(safe-area-inset-top))' : '3.5rem',
            // Reserve space for safe area at bottom
            paddingBottom: isIOS ? 'calc(1.5rem + env(safe-area-inset-bottom))' : '1.5rem',
          }}
        >
          {/* Video Container - Plyr uses natural video dimensions */}
          <div
            className="relative bg-black rounded-xl overflow-hidden mb-4"
            style={{
              width: isVerticalVideo ? '70%' : '100%',
              margin: isVerticalVideo ? '0 auto' : undefined,
            }}
          >
            {!hasError ? (
              <Plyr
                ref={plyrRef}
                source={plyrSource}
                options={plyrOptions}
                onError={() => setHasError(true)}
              />
            ) : (
              /* Error State */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-10">
                <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
                <p className="text-lg font-medium mb-2">
                  {language === 'ar' ? 'فشل تحميل الفيديو' : 'Failed to load video'}
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-4 px-6 py-2 bg-accent text-accent-text rounded-lg flex items-center gap-2 hover:bg-accent-warm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            )}
          </div>

          {/* Memory Info - Reserved space, scrollable if needed */}
          <div
            className="space-y-3 flex-shrink-0 overflow-y-auto"
            style={{
              // Ensure minimum height for caption area
              minHeight: '180px',
              // iOS-specific: smooth scrolling
              ...(isIOS && {
                WebkitOverflowScrolling: 'touch',
              }),
            }}
          >
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-text">
              {title}
            </h2>

            {/* Date */}
            <p className="text-sm text-text/60">
              {dateStr}
            </p>

            {/* Caption - Fully visible, no truncation */}
            {caption && (
              <p className="text-base md:text-lg text-text/80 leading-relaxed break-words whitespace-pre-wrap">
                {caption}
              </p>
            )}

            {/* People */}
            {memoryPeople.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {memoryPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full"
                  >
                    {person.photoURL && (
                      <img
                        src={person.photoURL}
                        alt={person.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm font-medium text-text">
                      {language === 'ar' ? person.nameAr : person.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Hints */}
            {(onNext || onPrevious) && (
              <div className="mt-6 flex justify-between items-center text-sm text-text/50">
                {onPrevious && (
                  <button
                    onClick={onPrevious}
                    className="px-4 py-2 hover:text-text transition-colors"
                  >
                    ← {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                )}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="px-4 py-2 hover:text-text transition-colors ml-auto"
                  >
                    {language === 'ar' ? 'التالي' : 'Next'} →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
