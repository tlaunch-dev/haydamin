import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { Memory, Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { updateMemory, deleteMemory, getAllMemories } from '../services/firestore';
import { deleteVideo, deleteThumbnail } from '../services/storage';
import { MemoryUploadModal } from './MemoryUploadModal';

interface MemoryCardProps {
  memory: Memory;
  storytellerName: string;
  people: Person[]; // Need this for edit modal
  isFeatured?: boolean;
  index: number;
}

export function MemoryCard({ memory, storytellerName, people, isFeatured = false, index }: MemoryCardProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Format duration (MM:SS)
  const minutes = Math.floor(memory.durationSeconds / 60);
  const seconds = memory.durationSeconds % 60;
  const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Pause all other videos when this one starts playing
  const pauseOtherVideos = () => {
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      if (video !== videoRef.current && !video.paused) {
        video.pause();
      }
    });
  };

  // Listen for native video control play events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      pauseOtherVideos();
      setIsPlaying(true);
    };

    video.addEventListener('play', handlePlay);

    return () => {
      video.removeEventListener('play', handlePlay);
    };
  }, [isExpanded]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  // Handle card click - expand and play
  const handleCardClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      // Wait for animation to complete before playing
      setTimeout(() => {
        if (videoRef.current) {
          pauseOtherVideos();
          videoRef.current.play().catch((error) => {
            console.error('Error playing video:', error);
          });
          setIsPlaying(true);
        }
      }, 500);
    }
  };

  // Handle video click - toggle play/pause
  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        pauseOtherVideos();
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Handle close - pause and collapse
  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsExpanded(false);
  };

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

  // Animation variants
  const cardVariants = {
    collapsed: {
      height: 'auto',
    },
    expanded: {
      height: 'auto',
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="collapsed"
      animate={isExpanded ? 'expanded' : 'collapsed'}
      transition={{
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1], // spring-ease-smooth
      }}
      className={`
        ${isFeatured ? 'w-full' : 'w-full md:w-3/5'}
        ${!isFeatured && index % 2 === 0 ? '' : 'md:ml-auto'}
      `}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: index * 0.1,
          ease: [0.34, 1.56, 0.64, 1], // spring-ease-smooth
        }}
        whileHover={!isExpanded ? { scale: 1.02 } : {}}
        whileTap={!isExpanded ? { scale: 0.98 } : {}}
        onClick={!isExpanded ? handleCardClick : undefined}
        className={`
          bg-card rounded-3xl p-6 shadow-sm relative
          ${!isExpanded ? 'cursor-pointer' : ''}
          transition-shadow duration-300
          ${!isExpanded ? 'hover:shadow-md' : 'shadow-lg'}
          ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* Action menu (only shown when collapsed and user is authenticated) */}
        {!isExpanded && user && (
          <div ref={menuRef} className="absolute top-4 right-4 z-10">
            {/* Three-dot menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
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
        <div className="relative aspect-video bg-text/10 rounded-2xl mb-4 overflow-hidden">
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
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent flex items-center justify-center shadow-lg"
                >
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-accent-text ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>
              </div>
            </>
          ) : (
            // Expanded: Show video player
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative w-full h-full"
            >
              <video
                ref={videoRef}
                src={memory.videoUrl}
                poster={memory.thumbnailUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full rounded-2xl"
                onClick={handleVideoClick}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-2xl font-bold text-text mb-1">{title}</h3>
          {caption && (
            <p className="text-lg font-light text-text/70 mb-3">{caption}</p>
          )}

          {/* Metadata */}
          <div className="text-base font-light text-accent">
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
