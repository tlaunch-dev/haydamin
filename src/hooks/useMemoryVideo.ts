import { useState, useRef, useEffect } from 'react';
import { Memory } from '../types';
import { usePlayback } from '../context/PlaybackContext';

interface UseMemoryVideoProps {
  memory: Memory;
  isExpanded: boolean;
  externalIsExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

/**
 * Hook to manage video playback state and interactions for a memory card
 * Handles play/pause, video events, and synchronization with PlaybackContext
 */
export const useMemoryVideo = ({
  memory,
  isExpanded,
  externalIsExpanded,
  onExpand,
  onCollapse,
}: UseMemoryVideoProps) => {
  const { playingMemoryId, setPlayingMemoryId } = usePlayback();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iconTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Video event handlers - only essential events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setPlayingMemoryId(memory.id);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (playingMemoryId === memory.id) {
        setPlayingMemoryId(null);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (playingMemoryId === memory.id) {
        setPlayingMemoryId(null);
      }
      // Reset video to beginning
      video.currentTime = 0;
      // Optionally collapse card when video ends
      if (onCollapse) {
        onCollapse();
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      const error = video.error;

      // Log detailed error for debugging iOS issues
      console.error('[VIDEO ERROR] iOS Debug:', {
        memoryId: memory.id,
        errorCode: error?.code,
        errorMessage: error?.message,
        videoSrc: video.src,
        currentSrc: video.currentSrc,
        networkState: video.networkState,
        readyState: video.readyState,
        crossOrigin: video.crossOrigin,
      });

      // Only show error UI for actual media errors
      if (error && error.code) {
        setHasError(true);
      }

      setIsPlaying(false);
      setIsLoading(false);

      if (playingMemoryId === memory.id) {
        setPlayingMemoryId(null);
      }
    };

    // Attach essential event listeners
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [memory.id, playingMemoryId, setPlayingMemoryId, onCollapse]);

  // Pause this video if another memory starts playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playingMemoryId !== null && playingMemoryId !== memory.id && !video.paused) {
      video.pause();
      video.currentTime = 0;
    }
  }, [playingMemoryId, memory.id]);

  // Watch for external collapse (when another card expands)
  useEffect(() => {
    if (externalIsExpanded !== undefined && !externalIsExpanded && isExpanded) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
      }

      if (iconTimerRef.current) {
        clearTimeout(iconTimerRef.current);
      }

      setShowPlayPauseIcon(false);
      setIsPlaying(false);
      setHasError(false);
    }
  }, [externalIsExpanded, isExpanded]);

  // Auto-play when card expands
  useEffect(() => {
    if (isExpanded && videoRef.current?.paused) {
      const video = videoRef.current;
      console.log('[VIDEO] Attempting autoplay:', {
        memoryId: memory.id,
        src: video.src,
        readyState: video.readyState,
        networkState: video.networkState,
      });

      // Play video when card finishes expanding
      video.play()
        .then(() => {
          console.log('[VIDEO] Autoplay succeeded:', memory.id);
        })
        .catch((error) => {
          console.error('[VIDEO] Autoplay failed:', {
            memoryId: memory.id,
            error: error.message,
            errorName: error.name,
          });
        });
    }
  }, [isExpanded, memory.id]);

  // Handle card click - just expand (video will auto-play via effect)
  const handleCardClick = () => {
    if (!isExpanded && onExpand) {
      onExpand();
    }
  };

  // Handle video click - toggle play/pause with icon feedback
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    // Toggle play/pause
    if (video.paused) {
      video.play().catch((error) => {
        console.warn('Play failed:', error.message);
      });
    } else {
      video.pause();
    }

    // Show icon feedback
    setShowPlayPauseIcon(true);
    if (iconTimerRef.current) {
      clearTimeout(iconTimerRef.current);
    }
    iconTimerRef.current = setTimeout(() => {
      setShowPlayPauseIcon(false);
    }, 800);
  };

  // Handle close - pause and reset everything
  const handleClose = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    if (iconTimerRef.current) {
      clearTimeout(iconTimerRef.current);
    }

    setShowPlayPauseIcon(false);
    setIsPlaying(false);
    setHasError(false);

    if (onCollapse) {
      onCollapse();
    }
  };

  return {
    videoRef,
    isPlaying,
    showPlayPauseIcon,
    isLoading,
    hasError,
    handleCardClick,
    handleVideoClick,
    handleClose,
  };
};
