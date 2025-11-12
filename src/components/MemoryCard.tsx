import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, MoreVertical, Pencil, Vault } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Memory, Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { updateMemory, deleteMemory, getAllMemories } from '../services/firestore';
import { deleteVideo, deleteThumbnail } from '../services/storage';
import { MemoryUploadModal } from './MemoryUploadModal';

// Hook to get responsive width values
const useResponsiveWidth = (isExpanded: boolean, isFeatured: boolean, index: number, nonFeaturedIndex?: number) => {
  // Calculate initial values immediately to prevent flashing
  const getInitialValues = () => {
    if (typeof window === 'undefined') {
      return { width: '100%', maxWidth: '100%', marginLeft: 'auto', marginLeftPx: null };
    }
    
    const viewportWidth = window.innerWidth;
    
    if (isExpanded) {
      // Expanded state
      let expandedWidth: string;
      let expandedMaxWidth: string;
      
      if (viewportWidth >= 1536) {
        expandedWidth = '80%';
        expandedMaxWidth = '56rem';
      } else if (viewportWidth >= 1280) {
        expandedWidth = '85%';
        expandedMaxWidth = '64rem';
      } else if (viewportWidth >= 1024) {
        expandedWidth = '90%';
        expandedMaxWidth = '72rem';
      } else if (viewportWidth >= 768) {
        expandedWidth = '95%';
        expandedMaxWidth = '64rem';
      } else {
        expandedWidth = '100%';
        expandedMaxWidth = '100%';
      }
      
      // On mobile, use auto margins for proper centering
      if (viewportWidth < 768) {
        return { width: expandedWidth, maxWidth: expandedMaxWidth, marginLeft: 'auto', marginLeftPx: null };
      }
      
      // Tablet+: calculate center margin
      const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
      const widthValue = expandedWidth.includes('%') 
        ? (viewportWidth * parseFloat(expandedWidth) / 100)
        : parseFloat(expandedWidth.replace('rem', '')) * 16;
      const actualWidth = Math.min(widthValue, parseFloat(expandedMaxWidth.replace('rem', '')) * 16);
      const centerMargin = Math.max(0, (containerMaxWidth - actualWidth) / 2); // Ensure non-negative
      
      return { width: expandedWidth, maxWidth: expandedMaxWidth, marginLeft: '0', marginLeftPx: centerMargin };
    } else if (isFeatured) {
      // Featured collapsed
      if (viewportWidth < 768) {
        // Mobile: use auto margins for centering, ensure maxWidth doesn't exceed viewport
        const maxWidthPx = Math.min(viewportWidth - 24, 672); // 42rem = 672px, but respect viewport
        return { width: '100%', maxWidth: `${maxWidthPx}px`, marginLeft: 'auto', marginLeftPx: null };
      } else {
        // Tablet+: calculate center margin
        const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
        const featuredWidth = 42 * 16;
        const centerMargin = Math.max(0, (containerMaxWidth - featuredWidth) / 2); // Ensure non-negative
        return { width: '100%', maxWidth: '42rem', marginLeft: '0', marginLeftPx: centerMargin };
      }
    } else {
      // Non-featured collapsed
      let collapsedWidth: string;
      let collapsedMaxWidth: string;
      
      if (viewportWidth >= 1536) {
        collapsedWidth = '33.333333%';
        collapsedMaxWidth = '28rem';
      } else if (viewportWidth >= 1280) {
        collapsedWidth = '40%';
        collapsedMaxWidth = '32rem';
      } else if (viewportWidth >= 1024) {
        collapsedWidth = '50%';
        collapsedMaxWidth = '36rem';
      } else if (viewportWidth >= 768) {
        collapsedWidth = '66.666667%';
        collapsedMaxWidth = '32rem';
      } else {
        collapsedWidth = '100%';
        collapsedMaxWidth = '100%';
      }
      
      const alternatingIndex = nonFeaturedIndex !== undefined ? nonFeaturedIndex : index;
      let marginLeftPx: number | null = null;
      
      if (viewportWidth >= 768 && alternatingIndex % 2 === 1) {
        const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
        const widthValue = collapsedWidth.includes('%')
          ? (viewportWidth * parseFloat(collapsedWidth) / 100)
          : parseFloat(collapsedWidth.replace('rem', '')) * 16;
        const actualWidth = Math.min(widthValue, parseFloat(collapsedMaxWidth.replace('rem', '')) * 16);
        marginLeftPx = containerMaxWidth - actualWidth;
      }
      
      return { 
        width: collapsedWidth, 
        maxWidth: collapsedMaxWidth, 
        marginLeft: marginLeftPx !== null ? '0' : '0',
        marginLeftPx: marginLeftPx !== null ? marginLeftPx : 0
      };
    }
  };

  const initialValues = getInitialValues();
  const [width, setWidth] = useState<string>(initialValues.width);
  const [maxWidth, setMaxWidth] = useState<string>(initialValues.maxWidth);
  const [marginLeft, setMarginLeft] = useState<string>(initialValues.marginLeft);
  const [marginLeftPx, setMarginLeftPx] = useState<number | null>(initialValues.marginLeftPx);

  useEffect(() => {
    const updateWidth = () => {
      const viewportWidth = window.innerWidth;
      
      if (isExpanded) {
        // Expanded state - almost full width, always centered (applies to both featured and non-featured)
        let expandedWidth: string;
        let expandedMaxWidth: string;
        
        if (viewportWidth >= 1536) {
          expandedWidth = '80%';
          expandedMaxWidth = '56rem'; // max-w-4xl
        } else if (viewportWidth >= 1280) {
          expandedWidth = '85%';
          expandedMaxWidth = '64rem'; // max-w-5xl
        } else if (viewportWidth >= 1024) {
          expandedWidth = '90%';
          expandedMaxWidth = '72rem'; // max-w-6xl
        } else if (viewportWidth >= 768) {
          expandedWidth = '95%';
          expandedMaxWidth = '64rem'; // max-w-5xl
        } else {
          expandedWidth = '100%';
          expandedMaxWidth = '100%';
        }
        
        setWidth(expandedWidth);
        setMaxWidth(expandedMaxWidth);
        
        // On mobile, use auto margins for proper centering
        if (viewportWidth < 768) {
          setMarginLeft('auto');
          setMarginLeftPx(null);
        } else {
          // Tablet+: calculate center position for smooth animation
          // Get container width (assuming max-w-5xl = 64rem = 1024px or use viewport)
          const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
          const widthValue = expandedWidth.includes('%') 
            ? (viewportWidth * parseFloat(expandedWidth) / 100)
            : parseFloat(expandedWidth.replace('rem', '')) * 16;
          const actualWidth = Math.min(widthValue, parseFloat(expandedMaxWidth.replace('rem', '')) * 16);
          const centerMargin = Math.max(0, (containerMaxWidth - actualWidth) / 2); // Ensure non-negative
          setMarginLeftPx(centerMargin);
          setMarginLeft('0'); // Use pixel value for animation
        }
      } else if (isFeatured) {
        // Featured card collapsed state
        setWidth('100%');
        setMaxWidth('42rem'); // max-w-2xl
        // Featured cards are always centered
        // On mobile, ensure we don't push the card off-screen
        if (viewportWidth < 768) {
          // Mobile: use auto margins for centering, ensure maxWidth doesn't exceed viewport
          setMaxWidth(`${Math.min(viewportWidth - 24, 672)}px`); // 42rem = 672px, but respect viewport
          setMarginLeft('auto');
          setMarginLeftPx(null);
        } else {
          // Tablet+: calculate center margin
          const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
          const featuredWidth = 42 * 16; // 42rem in pixels
          const centerMargin = Math.max(0, (containerMaxWidth - featuredWidth) / 2); // Ensure non-negative
          setMarginLeftPx(centerMargin);
          setMarginLeft('0');
        }
      } else {
        // Collapsed state - alternating widths
        if (viewportWidth >= 1536) {
          setWidth('33.333333%'); // w-1/3
          setMaxWidth('28rem'); // max-w-md
        } else if (viewportWidth >= 1280) {
          setWidth('40%'); // w-2/5
          setMaxWidth('32rem'); // max-w-lg
        } else if (viewportWidth >= 1024) {
          setWidth('50%'); // w-1/2
          setMaxWidth('36rem'); // max-w-xl
        } else if (viewportWidth >= 768) {
          setWidth('66.666667%'); // w-2/3
          setMaxWidth('32rem'); // max-w-lg
        } else {
          setWidth('100%');
          setMaxWidth('100%');
        }
        // Set margin for alternating pattern (only on tablet+)
        // Use nonFeaturedIndex if provided (for proper alternating), otherwise fall back to index
        const alternatingIndex = nonFeaturedIndex !== undefined ? nonFeaturedIndex : index;
        if (viewportWidth >= 768 && alternatingIndex % 2 === 1) {
          // Right side - calculate margin to push to right
          let collapsedWidth: string;
          if (viewportWidth >= 1536) {
            collapsedWidth = '33.333333%';
          } else if (viewportWidth >= 1280) {
            collapsedWidth = '40%';
          } else if (viewportWidth >= 1024) {
            collapsedWidth = '50%';
          } else {
            collapsedWidth = '66.666667%';
          }
          
          const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
          const widthValue = collapsedWidth.includes('%')
            ? (viewportWidth * parseFloat(collapsedWidth) / 100)
            : parseFloat(collapsedWidth.replace('rem', '')) * 16;
          const actualWidth = Math.min(widthValue, parseFloat(maxWidth.replace('rem', '')) * 16);
          const rightMargin = containerMaxWidth - actualWidth;
          setMarginLeftPx(rightMargin);
          setMarginLeft('0'); // Use pixel value
        } else {
          setMarginLeft('0');
          setMarginLeftPx(0);
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isExpanded, isFeatured, index, nonFeaturedIndex]);

  return { width, maxWidth, marginLeft, marginLeftPx };
};

interface MemoryCardProps {
  memory: Memory;
  people: Person[]; // Need this for edit modal
  isFeatured?: boolean;
  index: number;
  nonFeaturedIndex?: number; // Index among non-featured cards only (for alternating pattern)
  showNode?: boolean; // Whether to show a node at the top of the card
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  disableInitialAnimation?: boolean; // Disable initial animation when used in stagger context
}

export function MemoryCard({ 
  memory, 
  people, 
  isFeatured = false, 
  index,
  nonFeaturedIndex,
  showNode = false,
  isExpanded: externalIsExpanded,
  onExpand,
  onCollapse,
  disableInitialAnimation = false,
}: MemoryCardProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [betaUnlocked, setBetaUnlocked] = useState(false); // Track if beta features (vault) are unlocked
  const [isPlaying, setIsPlaying] = useState(false); // Track actual video playback state
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressOccurredRef = useRef(false);
  const touchStartTimeRef = useRef<number>(0);
  const iconTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressDuration = 500; // 500ms for long press

  const title = language === 'ar' ? memory.titleAr : memory.title;
  const caption = language === 'ar' ? memory.captionAr : memory.caption;

  // Format date as "X years ago"
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffYears = Math.floor(diffDays / 365);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffYears > 0) {
      if (language === 'ar') {
        return diffYears === 1 ? 'منذ سنة' : `منذ ${diffYears} سنوات`;
      }
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    } else if (diffMonths > 0) {
      if (language === 'ar') {
        return diffMonths === 1 ? 'منذ شهر' : `منذ ${diffMonths} أشهر`;
      }
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else if (diffDays > 0) {
      if (language === 'ar') {
        return diffDays === 1 ? 'منذ يوم' : `منذ ${diffDays} أيام`;
      }
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      return language === 'ar' ? 'اليوم' : 'Today';
    }
  };

  const dateStr = getTimeAgo(memory.dateRecorded);

  // Stop and reset all other videos - synchronous, no delays
  const stopOtherVideos = useCallback((currentVideo: HTMLVideoElement) => {
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      if (video !== currentVideo && !video.paused) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, []);

  // Centralized video event handling - this is the source of truth for playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      // Update state to reflect actual playback
      setIsPlaying(true);
      // Stop all other videos synchronously
      stopOtherVideos(video);
    };

    const handlePause = () => {
      // Update state to reflect actual playback
      setIsPlaying(false);
    };

    // Listen to actual video events as source of truth
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [stopOtherVideos]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside as any);
      };
    }
  }, [isMenuOpen]);

  // Setup long press handler for menu button
  useEffect(() => {
    const button = menuButtonRef.current;
    if (!button || isExpanded) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
      longPressOccurredRef.current = false;
      touchStartTimeRef.current = Date.now();
      
      longPressTimerRef.current = setTimeout(() => {
        longPressOccurredRef.current = true;
        setBetaUnlocked(true); // Unlock beta features (vault) on long press
        setIsMenuOpen(true);
        
        // Provide haptic feedback on mobile if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, longPressDuration);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation();
      const pressDuration = Date.now() - touchStartTimeRef.current;
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      // If it was a long press, prevent the normal click
      if (pressDuration >= longPressDuration) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // For short press, let the onClick handler open the menu
      // Don't open it here to avoid conflict with onClick toggle
      
      setTimeout(() => {
        longPressOccurredRef.current = false;
      }, 100);
    };

    const handleTouchCancel = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    // Use native event listeners with passive: false for better control
    button.addEventListener('touchstart', handleTouchStart, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: false });
    button.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchend', handleTouchEnd);
      button.removeEventListener('touchcancel', handleTouchCancel);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [isExpanded]);

  // Handle regular click (for desktop/mouse and mobile short press)
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    // Prevent normal toggle if long press occurred
    if (longPressOccurredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    // Regular click - show menu without beta features
    setBetaUnlocked(false);
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle card click - expand and play
  const handleCardClick = () => {
    if (!isExpanded) {
      // Notify parent to expand this card (will collapse others)
      if (onExpand) {
        onExpand();
      } else {
        setInternalIsExpanded(true);
      }
    }
  };

  // Autoplay when card expands - simple and clean
  useEffect(() => {
    if (isExpanded && videoRef.current) {
      // Just call play - the event listener will handle coordination
      videoRef.current.play().catch((error) => {
        console.error('Error autoplaying video:', error);
      });
    }
  }, [isExpanded]);

  // Handle video click - toggle play/pause with icon feedback
  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    // Toggle play/pause - use isPlaying state as source of truth
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('Error playing video:', error);
      });
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
    } else {
      setInternalIsExpanded(false);
    }
  };

  // Watch for external collapse (when another card expands)
  useEffect(() => {
    if (externalIsExpanded !== undefined && !externalIsExpanded && isExpanded) {
      // Card was externally collapsed - pause and reset
      const video = videoRef.current;
      if (video && isPlaying) {
        video.pause();
        video.currentTime = 0;
      }

      // Clean up state
      if (iconTimerRef.current) {
        clearTimeout(iconTimerRef.current);
      }
      setShowPlayPauseIcon(false);
      setIsPlaying(false);
      setInternalIsExpanded(false);
    }
  }, [externalIsExpanded, isExpanded, isPlaying]);

  // Handle edit
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsEditModalOpen(true);
  };

  // Handle toggle featured
  const handleToggleFeatured = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    setIsMenuOpen(false);

    try {
      const newFeaturedState = !memory.featured;

      // If setting as featured, unfeatured all others
      if (newFeaturedState) {
        const allMemories = await getAllMemories();
        const updatePromises = allMemories
          .filter((m) => m.id !== memory.id && m.featured)
          .map((m) => updateMemory(m.id, { featured: false, updatedAt: new Date() }));
        await Promise.all(updatePromises);
      }

      // Update this memory
      await updateMemory(memory.id, {
        featured: newFeaturedState,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  // Handle delete memory
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    setIsMenuOpen(false);

    const confirmed = window.confirm(
      language === 'ar'
        ? 'هل أنت متأكد أنك تريد حذف هذه الذكرى؟'
        : 'Are you sure you want to delete this memory?'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete video and thumbnail from storage
      await Promise.all([
        deleteVideo(memory.videoUrl),
        deleteThumbnail(memory.thumbnailUrl),
      ]);

      // Delete memory document from Firestore
      await deleteMemory(memory.id);
    } catch (error) {
      console.error('Error deleting memory:', error);
      alert(
        language === 'ar'
          ? 'فشل حذف الذكرى. يرجى المحاولة مرة أخرى'
          : 'Failed to delete memory. Please try again'
      );
      setIsDeleting(false);
    }
  };

  // Get responsive width values (includes margin for alternating pattern)
  const { width, maxWidth, marginLeft, marginLeftPx } = useResponsiveWidth(isExpanded, isFeatured, index, nonFeaturedIndex);

  return (
    <motion.div
      initial={false}
      animate={{
        width: width,
        maxWidth: maxWidth,
        marginLeft: marginLeftPx !== null ? `${marginLeftPx}px` : marginLeft,
        marginRight: marginLeftPx !== null ? '0' : (marginLeft === 'auto' ? 'auto' : '0'),
      }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1], // smooth easing
      }}
    >
      <motion.div
        layout={!disableInitialAnimation} // Only use layout animation when not in stagger mode
        {...(disableInitialAnimation
          ? { 
              // When in stagger mode, let parent control the animation
              // Don't set initial/animate here - parent wrapper will handle it
              initial: false,
            }
          : {
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
              transition: {
                layout: {
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                },
                opacity: {
                  duration: 0.5,
                  delay: index * 0.1,
                },
                scale: {
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.34, 1.56, 0.64, 1],
                },
              },
            }
        )}
        whileHover={!isExpanded ? { scale: 1.02 } : {}}
        whileTap={!isExpanded ? { scale: 0.98 } : {}}
        onClick={!isExpanded ? handleCardClick : undefined}
        className={`
          bg-card rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 shadow-sm relative
          ${!isExpanded ? 'cursor-pointer' : ''}
          transition-shadow duration-300
          ${!isExpanded ? 'hover:shadow-md' : 'shadow-lg'}
          ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* Node at the top of the card (for cards after featured) */}
        {showNode && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.1 + 0.5,
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="w-3 h-3 rounded-full bg-accent border-2 border-background shadow-sm" />
          </motion.div>
        )}

        {/* Action menu (only shown when collapsed and user is authenticated) */}
        {!isExpanded && user && (
          <div 
            ref={menuRef} 
            className="absolute top-3 right-3 md:top-4 md:right-4 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Three-dot menu button */}
            <button
              ref={menuButtonRef}
              onClick={handleMenuButtonClick}
              className="w-8 h-8 rounded-full bg-background/80 text-text/60 hover:text-accent hover:bg-background flex items-center justify-center transition-colors"
              aria-label={language === 'ar' ? 'القائمة' : 'Menu'}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg overflow-hidden border border-text/10"
                >
                  {/* Edit */}
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-background/50 transition-colors text-left"
                  >
                    <Pencil className="w-4 h-4 text-accent" />
                    <span className="text-text text-sm">
                      {language === 'ar' ? 'تعديل' : 'Edit'}
                    </span>
                  </button>

                  {/* Feature/Unfeature */}
                  <button
                    onClick={handleToggleFeatured}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-background/50 transition-colors text-left"
                  >
                    <Star
                      className="w-4 h-4 text-accent"
                      fill={memory.featured ? 'currentColor' : 'none'}
                    />
                    <span className="text-text text-sm">
                      {memory.featured
                        ? language === 'ar'
                          ? 'إلغاء التمييز'
                          : 'Unfeature'
                        : language === 'ar'
                        ? 'تمييز'
                        : 'Feature'}
                    </span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-background/50 transition-colors text-left disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="text-red-600 text-sm">
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </span>
                  </button>

                  {/* Vault option - only shown when beta is unlocked (long press) */}
                  {betaUnlocked && (
                    <>
                      <div className="h-px bg-text/10 my-1" />
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/memories');
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-background/50 transition-colors text-left"
                      >
                        <Vault className="w-4 h-4 text-accent" />
                        <span className="text-text text-sm">
                          {language === 'ar' ? 'الذكريات' : 'Memories'}
                        </span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Close button (only shown when expanded) */}
        {isExpanded && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-text/80 text-accent-text flex items-center justify-center hover:bg-text transition-colors"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Video/Thumbnail Area */}
        <div className={`relative bg-text/10 rounded-xl md:rounded-2xl mb-2 md:mb-3 lg:mb-4 overflow-hidden ${!isExpanded ? 'aspect-[16/10] md:aspect-video' : 'aspect-video'}`}>
          {!isExpanded ? (
            // Collapsed: Show thumbnail with play button
            <>
              <img
                src={memory.thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
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
          ) : (
            // Expanded: Show video player with custom controls
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative w-full h-full cursor-pointer"
              onClick={handleVideoClick}
            >
              <video
                ref={videoRef}
                src={memory.videoUrl}
                poster={memory.thumbnailUrl}
                playsInline
                className="w-full h-full rounded-2xl object-cover"
              >
                Your browser does not support the video tag.
              </video>

              {/* Custom Play/Pause Overlay */}
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
                        <svg className="w-10 h-10 md:w-12 md:h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        // Pause icon
                        <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                        </svg>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-text mb-0.5 md:mb-1">{title}</h3>
          {caption && (
            <p className="text-sm md:text-base lg:text-lg font-light text-text/70 mb-1">{caption}</p>
          )}

          {/* Metadata */}
          <div className="text-xs md:text-sm lg:text-base font-light text-accent text-right">
            <span>{dateStr}</span>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <MemoryUploadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        people={people}
        memory={memory}
      />
    </motion.div>
  );
}
