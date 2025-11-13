import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, Pencil, Vault, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Memory } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface MemoryCardMenuProps {
  memory: Memory;
  isMenuOpen: boolean;
  betaUnlocked: boolean;
  isDeleting: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  menuButtonRef: React.RefObject<HTMLButtonElement>;
  onMenuButtonClick: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onToggleFeatured: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onMenuClose: () => void;
}

/**
 * Menu dropdown component for memory card actions
 */
export function MemoryCardMenu({
  memory,
  isMenuOpen,
  betaUnlocked,
  isDeleting,
  menuRef,
  menuButtonRef,
  onMenuButtonClick,
  onEdit,
  onToggleFeatured,
  onDelete,
  onMenuClose,
}: MemoryCardMenuProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      ref={menuRef}
      className="absolute top-3 right-3 md:top-4 md:right-4 z-20"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Three-dot menu button */}
      <button
        ref={menuButtonRef}
        onClick={onMenuButtonClick}
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
              onClick={onEdit}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-background/50 transition-colors text-left"
            >
              <Pencil className="w-4 h-4 text-accent" />
              <span className="text-text text-sm">
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </span>
            </button>

            {/* Feature/Unfeature */}
            <button
              onClick={onToggleFeatured}
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
              onClick={onDelete}
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
                    onMenuClose();
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
  );
}

