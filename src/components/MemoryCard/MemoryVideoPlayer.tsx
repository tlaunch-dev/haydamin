import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Memory } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface MemoryVideoPlayerProps {
  memory: Memory;
  title: string;
  isExpanded: boolean;
  isPlaying: boolean;
  showPlayPauseIcon: boolean;
  hasError?: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onVideoClick: (e: React.MouseEvent<HTMLVideoElement>) => void;
  onCardClick?: () => void;
}

/**
 * Video player component for memory cards
 * Handles both thumbnail (collapsed) and video (expanded) states
 */
export function MemoryVideoPlayer({
  memory,
  title,
  isExpanded,
  isPlaying,
  showPlayPauseIcon,
  hasError = false,
  videoRef,
  onVideoClick,
  onCardClick,
}: MemoryVideoPlayerProps) {
  const { language } = useLanguage();

  // iOS Safari requires webkit attributes to be set imperatively
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x-webkit-airplay', 'allow');
    }
  }, [videoRef]);

  // Consolidated handler for both click and touch events (iOS Safari requirement)
  const handleVideoInteraction = (e: React.MouseEvent<HTMLVideoElement> | React.TouchEvent<HTMLVideoElement>) => {
    e.stopPropagation();

    const video = videoRef.current;
    if (!video || !video.paused) return;

    // Call play() synchronously within user gesture event (iOS Safari requirement)
    video.play()
      .then(() => {
        // Expand card after successful play
        if (onCardClick) {
          onCardClick();
        }
      })
      .catch(() => {
        // Still expand so user can manually play
        if (onCardClick) {
          onCardClick();
        }
      });
  };

  return (
    <div
      className={`relative bg-text/10 rounded-xl md:rounded-2xl mb-2 md:mb-3 lg:mb-4 overflow-hidden ${
        !isExpanded ? 'aspect-[16/10] md:aspect-video' : 'aspect-video'
      }`}
    >
      {/* Video element - always rendered but hidden when collapsed */}
      <video
        ref={videoRef}
        src={memory.videoUrl}
        poster={memory.thumbnailUrl}
        preload="metadata"
        controls={false}
        muted={false}
        playsInline
        onClick={!isExpanded ? handleVideoInteraction : onVideoClick}
        onTouchStart={!isExpanded ? handleVideoInteraction : undefined}
        className={`w-full h-full rounded-2xl object-contain ${
          !isExpanded ? 'opacity-0 absolute inset-0' : 'opacity-100'
        }`}
        style={!isExpanded ? { pointerEvents: 'auto', zIndex: 1 } : undefined}
      >
        Your browser does not support the video tag.
      </video>

      {/* Thumbnail overlay when collapsed */}
      {!isExpanded && (
        <>
          <img
            src={memory.thumbnailUrl}
            alt={title}
            className="w-full h-full object-contain pointer-events-none"
          />
          {/* Play button overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-accent flex items-center justify-center shadow-lg pointer-events-none"
            >
              <svg
                className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-accent-text ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.div>
          </div>
        </>
      )}

      {/* Error message (only when expanded) */}
      {isExpanded && hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center px-6">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-white text-lg font-medium mb-2">
              {language === 'ar' ? 'فشل تحميل الفيديو' : 'Video failed to load'}
            </p>
            <p className="text-white/70 text-sm">
              {language === 'ar' ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later'}
            </p>
          </div>
        </div>
      )}

      {/* Custom Play/Pause icon feedback (only when expanded) */}
      {isExpanded && !hasError && (
        <AnimatePresence>
          {showPlayPauseIcon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                {!isPlaying ? (
                  // Play icon
                  <svg
                    className="w-10 h-10 md:w-12 md:h-12 text-white ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  // Pause icon
                  <svg
                    className="w-10 h-10 md:w-12 md:h-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
