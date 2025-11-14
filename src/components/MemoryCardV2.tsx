import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Memory, Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MemoryUploadModal } from './MemoryUploadModal';
import { MemoryCardMenu } from './MemoryCard/MemoryCardMenu';
import { useMemoryMenu } from '../hooks/useMemoryMenu';
import { useMemoryActions } from '../hooks/useMemoryActions';
import { getTimeAgo } from '../utils/dateUtils';

interface MemoryCardV2Props {
  memory: Memory;
  people: Person[];
  isFeatured?: boolean;
  index: number;
  showNode?: boolean;
  onClick: () => void;
}

export function MemoryCardV2({
  memory,
  people,
  isFeatured = false,
  index,
  showNode = false,
  onClick,
}: MemoryCardV2Props) {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Menu state and interactions
  const {
    isMenuOpen,
    setIsMenuOpen,
    betaUnlocked,
    menuRef,
    menuButtonRef,
    handleMenuButtonClick,
  } = useMemoryMenu({ isExpanded: false });

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
      layout
      className={`
        w-full max-w-5xl mx-auto
        ${isFeatured ? 'md:max-w-4xl' : 'md:max-w-3xl'}
      `}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className={`
          bg-card rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-5 shadow-sm relative
          cursor-pointer transition-shadow duration-300 hover:shadow-md
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

        {/* Action menu (only shown when user is authenticated) */}
        {user && (
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

        {/* Thumbnail with Play Button Overlay */}
        <div className="relative w-full aspect-video bg-card-dark rounded-lg md:rounded-xl overflow-hidden mb-3 md:mb-4">
          {/* Thumbnail Image */}
          <img
            src={memory.thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/90 flex items-center justify-center hover:bg-accent transition-all hover:scale-110 shadow-lg">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-accent-text fill-accent-text ml-1" />
            </div>
          </div>

          {/* Duration Badge (if available) */}
          {memory.duration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
              {Math.floor(memory.duration / 60)}:{String(memory.duration % 60).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-text line-clamp-2">
            {title}
          </h3>

          {/* Date */}
          <p className="text-sm text-text/60">
            {dateStr}
          </p>

          {/* Caption */}
          {caption && (
            <p className="text-sm md:text-base text-text/70 line-clamp-3">
              {caption}
            </p>
          )}

          {/* People Tags */}
          {memory.people && memory.people.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {memory.people.slice(0, 3).map((personId) => {
                const person = people.find(p => p.id === personId);
                if (!person) return null;

                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 rounded-full"
                  >
                    {person.photoURL && (
                      <img
                        src={person.photoURL}
                        alt={person.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xs font-medium text-text">
                      {language === 'ar' ? person.nameAr : person.name}
                    </span>
                  </div>
                );
              })}
              {memory.people.length > 3 && (
                <div className="flex items-center px-2.5 py-1 bg-accent/10 rounded-full">
                  <span className="text-xs font-medium text-text">
                    +{memory.people.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Featured Badge */}
          {isFeatured && (
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                ⭐ {language === 'ar' ? 'مميز' : 'Featured'}
              </span>
            </div>
          )}
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
