import { useState, useRef, useEffect } from 'react';
import { motion, PanInfo, useDragControls } from 'framer-motion';
import { X, Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import { Memory, Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getTimeAgo } from '../utils/dateUtils';
import { refreshVideoUrl } from '../services/storage';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');

  // Panel state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // User interaction state
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Reset states when memory changes
  useEffect(() => {
    if (memory) {
      setCurrentVideoUrl(memory.videoUrl);
      setHasError(false);
      setIsLoading(true);
      setIsPlaying(false);
      setHasUserInteracted(false);
      setIsFullscreen(false);
    }
  }, [memory?.id]);

  // Auto-play when panel opens (muted initially for iOS compatibility)
  useEffect(() => {
    if (isOpen && videoRef.current && memory) {
      const video = videoRef.current;

      // Small delay to ensure video element is ready
      const timer = setTimeout(() => {
        video.play()
          .then(() => {
            console.log('[VIDEO PANEL] Auto-play succeeded');
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error('[VIDEO PANEL] Auto-play failed:', error);
            // Auto-play failed (expected on some browsers), will play on user interaction
          });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, memory?.id]);

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

  // Keyboard shortcuts - must be after all other hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          handleVideoClick();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext?.();
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

  // Calculate panel height based on state
  const getPanelHeight = () => {
    if (!isOpen) return '0%';
    if (isFullscreen) return '100vh';
    return '75vh'; // Default expanded state
  };

  // Handle drag end - snap to closest position
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Ignore very small drags (clicks or tiny movements)
    if (Math.abs(offset) < 10 && Math.abs(velocity) < 100) {
      return;
    }

    // Quick flick down - close
    if (velocity > 500) {
      onClose();
      return;
    }

    // Quick flick up from 75% - go fullscreen
    if (velocity < -500 && !isFullscreen) {
      setIsFullscreen(true);
      return;
    }

    // Slow drag - snap based on distance
    if (offset > 150) {
      // Dragged down significantly - close
      onClose();
    } else if (offset < -150 && !isFullscreen) {
      // Dragged up significantly - fullscreen
      setIsFullscreen(true);
    } else if (offset > 50 && isFullscreen) {
      // Dragged down from fullscreen - go to 75%
      setIsFullscreen(false);
    }
  };

  // Video event handlers
  const handleVideoClick = async (e?: React.MouseEvent) => {
    // Prevent drag system from detecting this as a drag
    e?.stopPropagation();

    if (!videoRef.current) return;

    const video = videoRef.current;

    if (video.paused) {
      // Video is paused - play it (and unmute if first time)
      try {
        if (!hasUserInteracted) {
          video.muted = false;
        }
        setHasUserInteracted(true);
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('[VIDEO PANEL] Play failed:', error);
      }
    } else if (video.muted && !hasUserInteracted) {
      // Video is playing but muted - just unmute, keep playing
      video.muted = false;
      setHasUserInteracted(true);
      // Don't show play/pause icon, just a brief flash to indicate unmute
      setShowPlayPause(true);
      setTimeout(() => setShowPlayPause(false), 400);
      return; // Early return to avoid showing pause icon
    } else {
      // Video is playing and unmuted - pause it
      video.pause();
      setIsPlaying(false);
    }

    // Show play/pause icon feedback
    setShowPlayPause(true);
    setTimeout(() => setShowPlayPause(false), 600);
  };

  const handleVideoReady = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = async () => {
    console.error('[VIDEO PANEL] Video error occurred');
    const video = videoRef.current;

    if (video && video.error) {
      console.error('[VIDEO PANEL] Error details:', {
        code: video.error.code,
        message: video.error.message,
        networkState: video.networkState,
        readyState: video.readyState,
      });
    }

    // Try refreshing the URL once
    if (!hasError && memory) {
      console.log('[VIDEO PANEL] Attempting URL refresh...');
      try {
        const freshUrl = await refreshVideoUrl(memory.videoUrl);
        setCurrentVideoUrl(freshUrl);
        if (video) {
          video.src = freshUrl;
          video.load();
        }
      } catch (error) {
        console.error('[VIDEO PANEL] URL refresh failed:', error);
        setHasError(true);
        setIsLoading(false);
      }
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (videoRef.current && memory) {
      setHasError(false);
      setIsLoading(true);
      videoRef.current.src = currentVideoUrl;
      videoRef.current.load();
    }
  };

  return (
    <>
      {/* Background Dimmer */}
      <motion.div
        className="fixed inset-0 bg-black z-40"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isOpen ? (isFullscreen ? 0.95 : 0.6) : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: 0.3 }}
      />

      {/* Video Panel */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 300 }}
        dragElastic={{ top: 0, bottom: 0.2 }}
        onDragEnd={handleDragEnd}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl overflow-hidden pb-safe"
        initial={{ y: '100%' }}
        animate={{
          y: isOpen ? 0 : '100%',
          height: getPanelHeight(),
        }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
      >
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1.5 bg-text/20 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-text/80 text-accent-text flex items-center justify-center hover:bg-text transition-colors"
          aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Container */}
        <div
          className="h-full overflow-y-auto px-4 pb-4"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Video Container */}
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
            <video
              ref={videoRef}
              src={currentVideoUrl}
              poster={memory.thumbnailUrl}
              className="w-full h-full object-contain"
              playsInline
              crossOrigin="anonymous"
              muted={!hasUserInteracted}
              preload="auto"
              onClick={handleVideoClick}
              onCanPlay={handleVideoReady}
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Loading Spinner */}
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Error State */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
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

            {/* Play/Pause Icon Overlay */}
            {showPlayPause && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="w-10 h-10 text-white fill-white" />
                  ) : (
                    <Play className="w-10 h-10 text-white fill-white ml-1" />
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Memory Info */}
          <div className="space-y-3">
            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-bold text-text">
              {title}
            </h2>

            {/* Date */}
            <p className="text-sm text-text/60">
              {dateStr}
            </p>

            {/* Caption */}
            {caption && (
              <p className="text-base md:text-lg text-text/80 leading-relaxed">
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
          </div>

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

        {/* Expand Indicator (when at 75%) */}
        {!isFullscreen && isOpen && (
          <motion.div
            className="absolute top-16 right-4 text-text/40 text-xs flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>{language === 'ar' ? 'اسحب للأعلى للملء الكامل' : 'Swipe up for fullscreen'}</span>
            <span>↑</span>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
