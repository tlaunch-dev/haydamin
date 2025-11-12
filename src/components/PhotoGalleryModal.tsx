import { useState, useCallback } from 'react';

interface PhotoGalleryModalProps {
  photos: string[];
  initialIndex?: number;
  personName: string;
  onClose: () => void;
}

const minSwipeDistance = 50;

export default function PhotoGalleryModal({ photos, initialIndex = 0, personName, onClose }: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  // Swipe gesture handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchEnd.y - touchStart.y);
    const isHorizontalSwipe = Math.abs(distanceX) > distanceY;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    // Only handle horizontal swipes
    if (isHorizontalSwipe) {
      if (isLeftSwipe) {
        goToNext();
      } else if (isRightSwipe) {
        goToPrevious();
      }
    }

    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, goToNext, goToPrevious]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-50 w-12 h-12 flex items-center justify-center"
        aria-label="Close gallery"
      >
        &times;
      </button>

      {/* Main image area - takes up space above thumbnails */}
      <div 
        className="flex-1 flex flex-col items-center justify-center p-4 pb-0" 
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: photos.length > 1 ? '120px' : '0' }}
      >
        <img
          src={photos[currentIndex]}
          alt={`${personName} - Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        
        {/* Photo counter */}
        {photos.length > 1 && (
          <div className="mt-4 text-white text-lg font-semibold">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip - fixed at bottom */}
      {photos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-4 px-4 flex justify-center overflow-x-auto">
          <div className="flex gap-2 max-w-full">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-accent scale-110'
                    : 'border-white/30 hover:border-white/60 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

