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
  const videoRef = useRef<HTMLVideoElement>(null);
  const iconTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Centralized video event handling - this is the source of truth for playback state
  // Video element is always rendered, so listeners can be attached immediately
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      // Update state to reflect actual playback
      setIsPlaying(true);
      // Set this memory as the currently playing one via context
      setPlayingMemoryId(memory.id);
    };

    const handlePause = () => {
      // Update state to reflect actual playback
      setIsPlaying(false);
      // Clear playing memory if this video was paused
      if (playingMemoryId === memory.id) {
        setPlayingMemoryId(null);
      }
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setIsPlaying(false);
      if (playingMemoryId === memory.id) {
        setPlayingMemoryId(null);
      }
    };

    // Listen to actual video events as source of truth
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [memory.id, playingMemoryId, setPlayingMemoryId]);

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
      // Card was externally collapsed - reset video position
      // Note: Video is already paused by PlaybackContext when another memory starts playing
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
      }

      // Clean up state
      if (iconTimerRef.current) {
        clearTimeout(iconTimerRef.current);
      }
      setShowPlayPauseIcon(false);
      setIsPlaying(false);
    }
  }, [externalIsExpanded, isExpanded]);

  // Handle card click - play first (synchronously), then expand
  const handleCardClick = () => {
    if (!isExpanded && videoRef.current) {
      // Call play() synchronously within user interaction for iOS unmuted autoplay
      const video = videoRef.current;

      // Video should have metadata loaded (preload="metadata") so play() works synchronously
      // This ensures iOS autoplay policy is satisfied - play() called in user interaction handler
      // with video ready to play immediately
      video.play().catch((error) => {
        console.error('Error playing video:', error);
        // If play fails, still expand so user can manually play
      });

      // Then expand the card (video already playing)
      if (onExpand) {
        onExpand();
      }
    }
  };

  // Handle video click - toggle play/pause with icon feedback
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    // Toggle play/pause - use native video.paused property as source of truth
    if (video.paused) {
      video.play().catch((error) => {
        console.error('Error playing video:', error);
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

    // Clear timers and reset state
    if (iconTimerRef.current) {
      clearTimeout(iconTimerRef.current);
    }
    setShowPlayPauseIcon(false);
    setIsPlaying(false);

    // Collapse the card
    if (onCollapse) {
      onCollapse();
    }
  };

  return {
    videoRef,
    isPlaying,
    showPlayPauseIcon,
    handleCardClick,
    handleVideoClick,
    handleClose,
  };
};

