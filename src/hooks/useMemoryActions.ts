import { useState } from 'react';
import { Memory } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { updateMemory, deleteMemory, getAllMemories } from '../services/firestore';
import { deleteVideo, deleteThumbnail } from '../services/storage';

interface UseMemoryActionsProps {
  memory: Memory;
}

/**
 * Hook to manage memory CRUD operations (edit, delete, feature toggle)
 */
export const useMemoryActions = ({ memory }: UseMemoryActionsProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Handle toggle featured
  const handleToggleFeatured = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const newFeaturedState = !memory.featured;

      // If setting as featured, unfeature all others
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

  // Handle edit
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  return {
    isDeleting,
    isEditModalOpen,
    setIsEditModalOpen,
    handleEdit,
    handleToggleFeatured,
    handleDelete,
  };
};

