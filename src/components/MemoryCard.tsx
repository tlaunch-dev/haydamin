import { useState } from 'react';
import { motion } from 'framer-motion';
import { Memory, Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MemoryUploadModal } from './MemoryUploadModal';
import { useResponsiveWidth } from '../hooks/useResponsiveWidth';
import { useMemoryVideo } from '../hooks/useMemoryVideo';
import { useMemoryMenu } from '../hooks/useMemoryMenu';
import { useMemoryActions } from '../hooks/useMemoryActions';
import { getTimeAgo } from '../utils/dateUtils';
import { MemoryCardMenu } from './MemoryCard/MemoryCardMenu';
import { MemoryVideoPlayer } from './MemoryCard/MemoryVideoPlayer';
import { MemoryCardContent } from './MemoryCard/MemoryCardContent';

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
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

  // Get responsive width values (includes margin for alternating pattern)
  const { width, maxWidth, marginLeft, marginLeftPx } = useResponsiveWidth(
    isExpanded,
    isFeatured,
    index,
    nonFeaturedIndex
  );

  // Video playback management
  const {
    videoRef,
    isPlaying,
    showPlayPauseIcon,
    hasError,
    handleCardClick: videoHandleCardClick,
    handleVideoClick,
    handleClose,
  } = useMemoryVideo({
    memory,
    isExpanded,
    externalIsExpanded,
    onExpand: onExpand || (() => setInternalIsExpanded(true)),
    onCollapse: onCollapse || (() => setInternalIsExpanded(false)),
  });

  // Menu state and interactions
  const {
    isMenuOpen,
    setIsMenuOpen,
    betaUnlocked,
    menuRef,
    menuButtonRef,
    handleMenuButtonClick,
  } = useMemoryMenu({ isExpanded });

  // Memory CRUD operations
  const {
    isDeleting,
    isEditModalOpen,
    setIsEditModalOpen,
    handleEdit,
    handleToggleFeatured,
    handleDelete,
  } = useMemoryActions({ memory });

  // Localized content
  const title = language === 'ar' ? memory.titleAr : memory.title;
  const caption = language === 'ar' ? memory.captionAr : memory.caption;
  const dateStr = getTimeAgo(memory.dateRecorded, language);

  // Handle card click - play video and expand
  const handleCardClick = () => {
    videoHandleCardClick();
  };

  // Handle menu close
  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  // Handle edit with menu close
  const handleEditWithMenuClose = (e: React.MouseEvent) => {
    handleEdit(e);
    setIsMenuOpen(false);
  };

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
        duration: 0.6, // Smooth animation for both expand and collapse
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <motion.div
        layout={!disableInitialAnimation} // Animate layout for both expand and collapse
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
                  duration: 0.6, // Smooth layout animation for both expand and collapse
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
          <MemoryCardMenu
            memory={memory}
            isMenuOpen={isMenuOpen}
            betaUnlocked={betaUnlocked}
            isDeleting={isDeleting}
            menuRef={menuRef}
            menuButtonRef={menuButtonRef}
            onMenuButtonClick={handleMenuButtonClick}
            onEdit={handleEditWithMenuClose}
            onToggleFeatured={handleToggleFeatured}
            onDelete={handleDelete}
            onMenuClose={handleMenuClose}
          />
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
        <MemoryVideoPlayer
          memory={memory}
          title={title}
          isExpanded={isExpanded}
          isPlaying={isPlaying}
          showPlayPauseIcon={showPlayPauseIcon}
          hasError={hasError}
          videoRef={videoRef}
          onVideoClick={handleVideoClick}
          onCardClick={handleCardClick}
        />

        {/* Content */}
        <MemoryCardContent
          title={title}
          caption={caption}
          dateStr={dateStr}
        />
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
