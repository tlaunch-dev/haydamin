import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Memory } from '../../types';

interface MemoryVideoPlayerProps {
  memory: Memory;
  title: string;
  isExpanded: boolean;
  isPlaying: boolean;
  showPlayPauseIcon: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onVideoClick: (e: React.MouseEvent<HTMLVideoElement>) => void;
  onCardClick?: () => void; // Handler for card click when collapsed
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
  onCardClick,
}: MemoryVideoPlayerProps) {
  // Set iOS Safari specific attributes after mount
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // iOS Safari requires these attributes to be set on the DOM element
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x-webkit-airplay', 'allow');
    }
  }, [videoRef]);
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
        preload="metadata"
        controls={false}
        muted={false}
        onClick={!isExpanded ? (e) => {
          // Handle click directly on video element when collapsed (for desktop and iOS)
          // iOS Safari requires play() to be called directly on video element
          e.stopPropagation();
          const video = videoRef.current;
          if (video && video.paused) {
            console.log(`[Video Debug] Memory ${memory.id} - Click on video (collapsed), attempting play`);
            // Call play() synchronously within click event
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log(`[Video Debug] Memory ${memory.id} - play() succeeded on click`);
                  // Expand card after successful play
                  if (onCardClick) {
                    onCardClick();
                  }
                })
                .catch((error) => {
                  console.error(`[Video Debug] Memory ${memory.id} - play() failed on click:`, error);
                  // Still expand so user can manually play
                  if (onCardClick) {
                    onCardClick();
                  }
                });
            }
          }
        } : onVideoClick}
        onTouchStart={!isExpanded ? (e) => {
          // On iOS Safari, handle touch directly on video element for autoplay
          // This ensures play() is called within the user interaction
          e.stopPropagation();
          const video = videoRef.current;
          if (video && video.paused) {
            console.log(`[Video Debug] Memory ${memory.id} - Touch start on video (collapsed), attempting play`);
            // Call play() synchronously within touch event
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log(`[Video Debug] Memory ${memory.id} - play() succeeded on touch`);
                  // Expand card after successful play
                  if (onCardClick) {
                    onCardClick();
                  }
                })
                .catch((error) => {
                  console.error(`[Video Debug] Memory ${memory.id} - play() failed on touch:`, error);
                  // Still expand so user can manually play
                  if (onCardClick) {
                    onCardClick();
                  }
                });
            }
          }
        } : undefined}
        onError={(e) => {
          const video = e.currentTarget;
          const error = video.error;
          
          console.error(`[Video Debug] Memory ${memory.id} - Video error event fired`, {
            memoryId: memory.id,
            videoUrl: memory.videoUrl,
            error: error ? {
              code: error.code,
              message: error.message,
              codeName: error.code === MediaError.MEDIA_ERR_ABORTED ? 'MEDIA_ERR_ABORTED' :
                       error.code === MediaError.MEDIA_ERR_NETWORK ? 'MEDIA_ERR_NETWORK' :
                       error.code === MediaError.MEDIA_ERR_DECODE ? 'MEDIA_ERR_DECODE' :
                       error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ? 'MEDIA_ERR_SRC_NOT_SUPPORTED' :
                       'UNKNOWN',
            } : null,
            networkState: video.networkState,
            networkStateName: video.networkState === 0 ? 'NETWORK_EMPTY' :
                             video.networkState === 1 ? 'NETWORK_IDLE' :
                             video.networkState === 2 ? 'NETWORK_LOADING' :
                             video.networkState === 3 ? 'NETWORK_NO_SOURCE' : 'UNKNOWN',
            readyState: video.readyState,
            readyStateName: video.readyState === 0 ? 'HAVE_NOTHING' :
                           video.readyState === 1 ? 'HAVE_METADATA' :
                           video.readyState === 2 ? 'HAVE_CURRENT_DATA' :
                           video.readyState === 3 ? 'HAVE_FUTURE_DATA' :
                           video.readyState === 4 ? 'HAVE_ENOUGH_DATA' : 'UNKNOWN',
            src: video.src,
            currentSrc: video.currentSrc,
            poster: video.poster,
            paused: video.paused,
            muted: video.muted,
            playsInline: video.playsInline,
            userAgent: navigator.userAgent,
          });
        }}
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

