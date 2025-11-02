import { useState } from 'react';

interface PhotoGalleryModalProps {
  photos: string[];
  initialIndex?: number;
  personName: string;
  onClose: () => void;
}

export default function PhotoGalleryModal({ photos, initialIndex = 0, personName, onClose }: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
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

      {/* Previous button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-50 w-12 h-12 flex items-center justify-center"
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      {/* Main image */}
      <div className="relative w-full h-full flex flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={photos[currentIndex]}
          alt={`${personName} - Photo ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        
        {/* Photo counter */}
        {photos.length > 1 && (
          <div className="mt-4 text-white text-lg font-semibold">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
        
        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto max-w-full pb-2">
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
        )}
      </div>

      {/* Next button */}
      {photos.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-50 w-12 h-12 flex items-center justify-center"
          aria-label="Next photo"
        >
          ›
        </button>
      )}
    </div>
  );
}

