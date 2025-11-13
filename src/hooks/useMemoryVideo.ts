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

  // Debug: Log video info on mount
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      console.log(`[Video Debug] Memory ${memory.id} - Video element mounted`, {
        memoryId: memory.id,
        videoUrl: memory.videoUrl,
        videoSrc: video.src,
        readyState: video.readyState,
        networkState: video.networkState,
        paused: video.paused,
        muted: video.muted,
        playsInline: video.playsInline,
        preload: video.preload,
        userAgent: navigator.userAgent,
      });
    }
  }, [memory.id, memory.videoUrl]);

  // Centralized video event handling - this is the source of truth for playback state
  // Video element is always rendered, so listeners can be attached immediately
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Video started playing`, {
        memoryId: memory.id,
        currentTime: video.currentTime,
        duration: video.duration,
        readyState: video.readyState,
        networkState: video.networkState,
      });
      // Update state to reflect actual playback
      setIsPlaying(true);
      // Set this memory as the currently playing one via context
      setPlayingMemoryId(memory.id);
    };

    const handlePause = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Video paused`, {
        memoryId: memory.id,
        currentTime: video.currentTime,
        duration: video.duration,
      });
      // Update state to reflect actual playback
      setIsPlaying(false);
      // Clear playing memory if this video was paused
      if (playingMemoryId === memory.id) {
        setPlayingMemoryId(null);
      }
    };

    const handleError = (e: Event) => {
      const video = e.target as HTMLVideoElement;
      const error = video.error;
      
      console.error('Video error:', {
        error,
        code: error?.code,
        message: error?.message,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src,
      });

      // Log specific error codes for debugging
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            console.error('Video playback aborted');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            console.error('Network error while loading video');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            console.error('Video decode error - codec may not be supported');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.error('Video source not supported - check format and CORS');
            break;
        }
      }

      setIsPlaying(false);
      if (playingMemoryId === memory.id) {
        setPlayingMemoryId(null);
      }
    };

    const handleLoadStart = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Load start`, {
        memoryId: memory.id,
        networkState: video.networkState,
      });
    };

    const handleLoadedMetadata = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Metadata loaded`, {
        memoryId: memory.id,
        readyState: video.readyState,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        networkState: video.networkState,
      });
    };

    const handleLoadedData = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Data loaded`, {
        memoryId: memory.id,
        readyState: video.readyState,
        networkState: video.networkState,
      });
    };

    const handleCanPlay = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Can play`, {
        memoryId: memory.id,
        readyState: video.readyState,
        networkState: video.networkState,
        paused: video.paused,
      });
    };

    const handleCanPlayThrough = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Can play through`, {
        memoryId: memory.id,
        readyState: video.readyState,
        networkState: video.networkState,
      });
    };

    const handleWaiting = () => {
      console.warn(`[Video Debug] Memory ${memory.id} - Waiting for data`, {
        memoryId: memory.id,
        readyState: video.readyState,
        networkState: video.networkState,
        currentTime: video.currentTime,
      });
    };

    const handleStalled = () => {
      console.warn(`[Video Debug] Memory ${memory.id} - Stalled`, {
        memoryId: memory.id,
        networkState: video.networkState,
        readyState: video.readyState,
      });
    };

    const handleSuspend = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Suspend`, {
        memoryId: memory.id,
        networkState: video.networkState,
      });
    };

    const handlePlaying = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Playing`, {
        memoryId: memory.id,
        currentTime: video.currentTime,
        readyState: video.readyState,
      });
    };

    const handleSeeking = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Seeking`, {
        memoryId: memory.id,
        currentTime: video.currentTime,
      });
    };

    const handleSeeked = () => {
      console.log(`[Video Debug] Memory ${memory.id} - Seeked`, {
        memoryId: memory.id,
        currentTime: video.currentTime,
      });
    };

    const handleTimeUpdate = () => {
      // Only log every 5 seconds to avoid spam
      if (Math.floor(video.currentTime) % 5 === 0 && video.currentTime > 0) {
        console.log(`[Video Debug] Memory ${memory.id} - Time update`, {
          memoryId: memory.id,
          currentTime: video.currentTime,
          duration: video.duration,
          buffered: video.buffered.length > 0 ? {
            start: video.buffered.start(0),
            end: video.buffered.end(0),
          } : null,
        });
      }
    };

    // Listen to actual video events as source of truth
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('play', handlePlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('suspend', handleSuspend);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('suspend', handleSuspend);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, [memory.id, playingMemoryId, setPlayingMemoryId]);

  // Pause this video if another memory starts playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playingMemoryId !== null && playingMemoryId !== memory.id && !video.paused) {
      console.log(`[Video Debug] Memory ${memory.id} - Pausing because another memory (${playingMemoryId}) is playing`);
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
      const video = videoRef.current;
      
      console.log(`[Video Debug] Memory ${memory.id} - Card clicked, attempting to play`, {
        memoryId: memory.id,
        isExpanded,
        readyState: video.readyState,
        networkState: video.networkState,
        paused: video.paused,
        src: video.src,
        userAgent: navigator.userAgent,
      });

      // Ensure video is ready before attempting to play (iOS Safari requirement)
      const attemptPlay = () => {
        if (video.readyState >= 2) {
          // Video has enough data to play
          console.log(`[Video Debug] Memory ${memory.id} - Calling play() (readyState >= 2)`);
          video.play()
            .then(() => {
              console.log(`[Video Debug] Memory ${memory.id} - play() promise resolved`);
            })
            .catch((error) => {
              console.error(`[Video Debug] Memory ${memory.id} - play() promise rejected:`, {
                error,
                name: error?.name,
                message: error?.message,
                readyState: video.readyState,
                networkState: video.networkState,
                paused: video.paused,
              });
              // If play fails, still expand so user can manually play
            });
        } else {
          console.log(`[Video Debug] Memory ${memory.id} - Waiting for metadata (readyState: ${video.readyState})`);
          // Wait for metadata to load
          const onMetadataLoaded = () => {
            console.log(`[Video Debug] Memory ${memory.id} - Metadata loaded, calling play()`);
            video.play()
              .then(() => {
                console.log(`[Video Debug] Memory ${memory.id} - play() promise resolved after metadata`);
              })
              .catch((error) => {
                console.error(`[Video Debug] Memory ${memory.id} - play() promise rejected after metadata:`, {
                  error,
                  name: error?.name,
                  message: error?.message,
                  readyState: video.readyState,
                  networkState: video.networkState,
                });
              });
            video.removeEventListener('loadedmetadata', onMetadataLoaded);
          };
          video.addEventListener('loadedmetadata', onMetadataLoaded);
        }
      };

      attemptPlay();

      // Then expand the card (video already playing or will play)
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

    console.log(`[Video Debug] Memory ${memory.id} - Video clicked`, {
      memoryId: memory.id,
      paused: video.paused,
      readyState: video.readyState,
      networkState: video.networkState,
      currentTime: video.currentTime,
    });

    // Toggle play/pause - use native video.paused property as source of truth
    if (video.paused) {
      console.log(`[Video Debug] Memory ${memory.id} - Video is paused, calling play()`);
      video.play()
        .then(() => {
          console.log(`[Video Debug] Memory ${memory.id} - play() succeeded on video click`);
        })
        .catch((error) => {
          console.error(`[Video Debug] Memory ${memory.id} - play() failed on video click:`, {
            error,
            name: error?.name,
            message: error?.message,
            readyState: video.readyState,
            networkState: video.networkState,
          });
        });
    } else {
      console.log(`[Video Debug] Memory ${memory.id} - Video is playing, calling pause()`);
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

