import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePeople } from '../hooks/usePeople';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/i18n';
import { Person } from '../types';
import CedarBackground from '../components/CedarBackground';

interface PhotoWithMetadata {
  url: string;
  personId: string;
  personName: string;
  personNameAr: string;
  relationship: string;
  relationshipAr: string;
}

const AUTO_ADVANCE_INTERVAL = 15000; // 15 seconds
const minSwipeDistance = 50;

export function GalleryMode() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { people, loading, error } = usePeople();
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [pullDownStart, setPullDownStart] = useState<{ y: number } | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preloadImagesRef = useRef<Set<string>>(new Set());

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  // Aggregate all additional photos from all people
  useEffect(() => {
    if (loading) return;

    const allPhotos: PhotoWithMetadata[] = [];

    people.forEach((person: Person) => {
      // Only collect from photos[] array, exclude primaryPhoto
      if (person.photos && person.photos.length > 0) {
        person.photos.forEach((photoUrl: string) => {
          if (photoUrl && photoUrl.trim() !== '') {
            allPhotos.push({
              url: photoUrl,
              personId: person.id,
              personName: person.name,
              personNameAr: person.nameAr,
              relationship: person.relationship,
              relationshipAr: person.relationshipAr,
            });
          }
        });
      }
    });

    // Randomize order using Fisher-Yates shuffle for better distribution
    for (let i = allPhotos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPhotos[i], allPhotos[j]] = [allPhotos[j], allPhotos[i]];
    }
    
    setPhotos(allPhotos);
    setCurrentIndex(0);
  }, [people, loading]);

  // Preload adjacent photos for smooth transitions
  useEffect(() => {
    if (photos.length === 0) return;

    const preloadImage = (url: string) => {
      if (preloadImagesRef.current.has(url)) return;
      preloadImagesRef.current.add(url);
      const img = new Image();
      img.src = url;
    };

    // Preload next photo
    const nextIndex = (currentIndex + 1) % photos.length;
    if (photos[nextIndex]) {
      preloadImage(photos[nextIndex].url);
    }

    // Preload previous photo
    const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    if (photos[prevIndex]) {
      preloadImage(photos[prevIndex].url);
    }
  }, [photos, currentIndex]);

  const goToNext = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    // Reset auto-advance timer by unpausing
    setIsPaused(false);
  }, [photos.length]);

  const goToPrevious = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    // Reset auto-advance timer by unpausing
    setIsPaused(false);
  }, [photos.length]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleExit = useCallback(() => {
    setIsExiting(true);
    navigate('/');
  }, [navigate]);

  // Auto-advance timer
  useEffect(() => {
    if (photos.length === 0 || isPaused || isExiting) {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      return;
    }

    autoAdvanceTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, AUTO_ADVANCE_INTERVAL);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearInterval(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [photos.length, isPaused, isExiting]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (photos.length === 0) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          togglePause();
          break;
        case 'Escape':
          e.preventDefault();
          handleExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, goToNext, goToPrevious, togglePause, handleExit]);

  // Swipe gesture handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setPullDownStart({ y: e.touches[0].clientY });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchEnd.y - touchStart.y; // Positive = downward
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);
    const isPullDown = distanceY > minSwipeDistance && isVerticalSwipe;

    // Pull down to exit (mobile) - check if user pulled down significantly
    if (isPullDown && pullDownStart && touchEnd.y > pullDownStart.y + 100) {
      handleExit();
      return;
    }

    // Horizontal swipe for navigation (only if not vertical scrolling)
    if (!isVerticalSwipe) {
      if (isLeftSwipe) {
        goToNext();
      } else if (isRightSwipe) {
        goToPrevious();
      }
    }

    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
    setPullDownStart(null);
  }, [touchStart, touchEnd, pullDownStart, goToNext, goToPrevious, handleExit]);

  // Handle tap anywhere to pause/resume
  const handleTap = useCallback((e: React.MouseEvent) => {
    // Only handle clicks on the main content area, not on overlays
    if ((e.target as HTMLElement).closest('.person-attribution')) return;
    togglePause();
  }, [togglePause]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className={`${fontClass} text-2xl text-text`}>{t('loading', language)}</h1>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className={`${fontClass} text-2xl text-text`}>{t('error_loading', language)}</h1>
      </div>
    );
  }

  // Show empty state if no photos
  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <CedarBackground />
        <div className="text-center z-10">
          <h1 className={`${fontClass} text-3xl md:text-4xl font-bold text-text mb-4`}>
            {t('no_photos', language)}
          </h1>
          <button
            onClick={() => navigate('/')}
            className={`${fontClass} px-6 py-3 rounded-full bg-accent text-accent-text font-semibold hover:bg-accent-warm transition-colors`}
          >
            {t('back_to_hub', language)}
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];
  const displayName = language === 'ar' ? currentPhoto.personNameAr : currentPhoto.personName;
  const displayRelationship = language === 'ar' ? currentPhoto.relationshipAr : currentPhoto.relationship;

  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleTap}
    >
      {/* Main photo display with smooth transitions */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          key={currentPhoto.url}
          className="absolute inset-0 flex items-center justify-center animate-fade-in"
          style={{
            animation: 'fadeInZoom 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <img
            src={currentPhoto.url}
            alt={`${displayName} - ${displayRelationship}`}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            style={{
              filter: 'brightness(1) contrast(1)',
            }}
          />
        </div>
      </div>

      {/* Exit button - top left corner */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10">
        <button
          onClick={handleExit}
          className="bg-card/90 backdrop-blur-sm text-accent rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shadow-md transition-all duration-300 ease-out hover:shadow-lg hover:scale-105"
          aria-label={t('back_to_hub', language)}
          title={t('back_to_hub', language)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6 md:w-7 md:h-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Play/Pause indicator - top right corner */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 pointer-events-none">
        <div className="bg-accent/80 backdrop-blur-sm rounded-full p-2.5 md:p-3 shadow-md animate-fade-in">
          {isPaused ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 md:w-6 md:h-6 text-accent-text"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 md:w-6 md:h-6 text-accent-text"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </div>

      {/* Person attribution overlay - bottom right corner */}
      <div className="person-attribution absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 pointer-events-none">
        <div 
          key={`${currentPhoto.personId}-${currentIndex}`}
          className="bg-black/70 backdrop-blur-md rounded-xl px-5 py-3 shadow-xl border border-white/10 animate-fade-in"
          style={{
            animation: 'fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <p className={`${fontClass} text-white text-sm md:text-base font-semibold mb-1`}>
            {displayName}
          </p>
          <p className={`${fontClass} text-white/80 text-xs md:text-sm`}>
            {displayRelationship}
          </p>
        </div>
      </div>

      {/* Pull down indicator (mobile only, when pulling down) */}
      {pullDownStart && touchEnd && touchEnd.y > pullDownStart.y + 50 && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none animate-fade-in">
          <div className="bg-accent/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2">
            <span className={`${fontClass} text-sm text-accent-text font-semibold`}>
              {t('pull_to_exit', language)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

