import { motion, AnimatePresence } from 'framer-motion';
import { Memory } from '../../types';

interface MemoryVideoPlayerProps {
  memory: Memory;
  title: string;
  isExpanded: boolean;
  isPlaying: boolean;
  showPlayPauseIcon: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onVideoClick: (e: React.MouseEvent<HTMLVideoElement>) => void;
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
  videoRef,
  onVideoClick,
}: MemoryVideoPlayerProps) {
  return (
    <div
      className={`relative bg-text/10 rounded-xl md:rounded-2xl mb-2 md:mb-3 lg:mb-4 overflow-hidden ${
        !isExpanded ? 'aspect-[16/10] md:aspect-video' : 'aspect-video'
      }`}
    >
      {/* Video element always rendered (hidden when collapsed) */}
      <video
        ref={videoRef}
        src={memory.videoUrl}
        poster={memory.thumbnailUrl}
        playsInline
        preload="metadata" // Preload metadata so video is ready when clicked (required for iOS unmuted autoplay)
        onClick={onVideoClick}
        className={`w-full h-full rounded-2xl object-contain ${
          !isExpanded ? 'opacity-0 absolute inset-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        Your browser does not support the video tag.
      </video>

      {/* Thumbnail overlay when collapsed */}
      {!isExpanded && (
        <>
          <img
            src={memory.thumbnailUrl}
            alt={title}
            className="w-full h-full object-contain"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-accent flex items-center justify-center shadow-lg"
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

      {/* Custom Play/Pause Overlay (only when expanded) */}
      {isExpanded && (
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

