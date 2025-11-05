import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Memory } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MemoryCardProps {
  memory: Memory;
  storytellerName: string;
  isFeatured?: boolean;
  index: number;
}

export function MemoryCard({ memory, storytellerName, isFeatured = false, index }: MemoryCardProps) {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const title = language === 'ar' ? memory.titleAr : memory.title;
  const caption = language === 'ar' ? memory.captionAr : memory.caption;

  // Format date
  const dateStr = memory.dateRecorded.toLocaleDateString(
    language === 'ar' ? 'ar-EG' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Format duration (MM:SS)
  const minutes = Math.floor(memory.durationSeconds / 60);
  const seconds = memory.durationSeconds % 60;
  const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Handle card click - expand and play
  const handleCardClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      // Wait for animation to complete before playing
      setTimeout(() => {
        if (videoRef.current) {
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
        `}
      >
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
          <div className="text-base font-light text-accent flex items-center gap-2">
            <span>{storytellerName}</span>
            <span>·</span>
            <span>{dateStr}</span>
            <span>·</span>
            <span>{durationStr}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
