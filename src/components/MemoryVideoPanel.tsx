import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, AlertCircle, RefreshCw, Maximize2 } from 'lucide-react';
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

  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');

  // User interaction state
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Track if video has started loading successfully
  const hasLoadedDataRef = useRef(false);

  // Detect if on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Reset states when memory changes
  useEffect(() => {
    if (memory) {
      hasLoadedDataRef.current = false;
      setCurrentVideoUrl(memory.videoUrl);
      setHasError(false);
      setIsLoading(true);
      setIsPlaying(false);
      setHasUserInteracted(false);
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

  // Video event handlers
  const handleVideoClick = async (e?: React.MouseEvent) => {
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

  const handleVideoLoadedData = () => {
    // Mark that video has successfully started loading
    hasLoadedDataRef.current = true;
  };

  const handleVideoReady = () => {
    // Video is ready to play
    hasLoadedDataRef.current = true;
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

    // Only show error if video has started loading (not spurious initial error)
    // Video readyState will be HAVE_NOTHING (0) or HAVE_METADATA (1) if it failed early
    if (video && hasLoadedDataRef.current && video.readyState < 2) {
      // Video genuinely failed after starting to load - try URL refresh
      if (!hasError && memory) {
        console.log('[VIDEO PANEL] Attempting URL refresh...');
        try {
          const freshUrl = await refreshVideoUrl(memory.videoUrl);
          setCurrentVideoUrl(freshUrl);
          hasLoadedDataRef.current = false; // Reset for new attempt
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
    } else if (video && video.readyState >= 2) {
      // Video has loaded data successfully - ignore transient errors
      console.log('[VIDEO PANEL] Ignoring transient error, video has data');
    }
  };

  const handleRetry = () => {
    if (videoRef.current && memory) {
      hasLoadedDataRef.current = false;
      setHasError(false);
      setIsLoading(true);
      videoRef.current.src = currentVideoUrl;
      videoRef.current.load();
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        // Safari support
        (videoRef.current as any).webkitRequestFullscreen();
      }
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

      {/* Video Panel */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl overflow-hidden h-[50vh] md:h-[80vh]"
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
        {/* Header with Fullscreen Toggle (mobile only) */}
        {isMobile && (
          <div className="w-full flex items-center justify-between px-4 pt-3 pb-2 border-b border-text/10">
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-2 text-text/60 hover:text-text transition-colors text-sm"
            >
              <Maximize2 className="w-4 h-4" />
              <span>{language === 'ar' ? 'ملء الشاشة' : 'Fullscreen'}</span>
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-text/80 text-accent-text flex items-center justify-center hover:bg-text transition-colors"
          aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Container */}
        <div className="h-full px-4 pb-4 pt-2 flex flex-col overflow-hidden">
          {/* Video Container */}
          <div className="relative w-full bg-black rounded-xl overflow-hidden mb-4 flex-shrink-0" style={{ aspectRatio: '16/9' }}>
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
              onLoadedData={handleVideoLoadedData}
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
          <div className="space-y-3 flex-1 overflow-y-auto">
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
      </motion.div>
    </>
  );
}
