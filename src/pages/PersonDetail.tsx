import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { usePeople } from '../hooks/usePeople';
import { updatePerson, deletePerson } from '../services/firestore';
import { uploadPhoto, deletePhoto } from '../services/storage';
import { translateToArabic } from '../services/translate';
import BackButton from '../components/BackButton';
import FamilyLinkCard from '../components/FamilyLinkCard';
import LanguageToggle from '../components/LanguageToggle';
import ImageCropDialog from '../components/ImageCropDialog';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import { useLanguage } from '../context/LanguageContext';
import { getPersonName, getRelationship, getLocation, getFavoriteFood, getAbout, t } from '../utils/i18n';
import { Person } from '../types';

// Utility function - parse date as UTC to avoid timezone issues
const calculateAge = (birthdayString: string | undefined) => {
  if (!birthdayString) return null;
  // Parse as UTC date to avoid timezone shifting
  const [year, month, day] = birthdayString.split('-').map(Number);
  const birthday = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  let age = today.getFullYear() - birthday.getUTCFullYear();
  const monthDiff = today.getMonth() - birthday.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getUTCDate())) {
    age--;
  }
  return age;
};

// Format date for display without timezone issues
const formatBirthdayDisplay = (birthdayString: string | undefined, language: string) => {
  if (!birthdayString) return '';
  // Parse as UTC to avoid timezone shifting
  const [year, month, day] = birthdayString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
};

// Helper function to get random unshown person
const getRandomUnshownPerson = (people: Person[], shownIds: string[]): Person | null => {
  const unshown = people.filter(p => !shownIds.includes(p.id));
  if (unshown.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * unshown.length);
  return unshown[randomIndex];
};

// LocalStorage keys for game mode
const GAME_MODE_SHOWN_IDS_KEY = 'haydamin_game_mode_shown_ids';

export function PersonDetail() {
  const { personId } = useParams<{ personId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isGameMode = searchParams.get('game') === 'true';
  const { language } = useLanguage();
  const { people, loading, error } = usePeople();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPerson, setEditedPerson] = useState<Partial<Person> | null>(null);
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [newPrimaryPhoto, setNewPrimaryPhoto] = useState<File | null>(null);
  const [newPrimaryPhotoPreview, setNewPrimaryPhotoPreview] = useState<string>('');
  const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Helper functions
  const getPersonById = (id: string): Person | undefined => {
    return people.find(p => p.id === id);
  };
  
  const getSpouse = (id: string): Person | undefined => {
    const person = getPersonById(id);
    if (!person?.spouseId) return undefined;
    return getPersonById(person.spouseId);
  };
  
  const getChildren = (id: string): Person[] => {
    const person = getPersonById(id);
    if (!person?.childrenIds) return [];
    return person.childrenIds.map(childId => getPersonById(childId)).filter(Boolean) as Person[];
  };

  // Reset reveal state when person changes
  useEffect(() => {
    setIsRevealed(false);
  }, [personId]);

  // Track shown person in game mode
  useEffect(() => {
    if (isGameMode && personId && !loading && people.length > 0) {
      const shownIds = JSON.parse(localStorage.getItem(GAME_MODE_SHOWN_IDS_KEY) || '[]');
      if (!shownIds.includes(personId)) {
        shownIds.push(personId);
        localStorage.setItem(GAME_MODE_SHOWN_IDS_KEY, JSON.stringify(shownIds));
      }
    }
  }, [isGameMode, personId, loading, people.length]);

  // Handle next person in game mode
  const handleNextPerson = useCallback(() => {
    if (!isGameMode || people.length === 0 || !isRevealed) return;
    
    const shownIds = JSON.parse(localStorage.getItem(GAME_MODE_SHOWN_IDS_KEY) || '[]');
    const nextPerson = getRandomUnshownPerson(people, shownIds);
    
    if (nextPerson) {
      navigate(`/person/${nextPerson.id}?game=true`, { replace: false });
      setIsRevealed(false);
    } else {
      // All people have been shown - reset and start over
      localStorage.removeItem(GAME_MODE_SHOWN_IDS_KEY);
      const randomPerson = people[Math.floor(Math.random() * people.length)];
      navigate(`/person/${randomPerson.id}?game=true`, { replace: false });
      setIsRevealed(false);
    }
  }, [isGameMode, people, navigate, isRevealed]);

  // Handle exiting game mode
  const handleExitGameMode = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Swipe gesture handlers for game mode
  const minSwipeDistance = 50; // Minimum distance in pixels to register a swipe

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isGameMode || !isRevealed) return;
    const touch = e.touches[0];
    setTouchEnd(null);
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isGameMode || !isRevealed) return;
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const onTouchEnd = () => {
    if (!isGameMode || !isRevealed || !touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Only trigger on horizontal left swipe (not vertical scrolling)
    if (isLeftSwipe && !isVerticalSwipe) {
      handleNextPerson();
    }
    
    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Exit edit mode when navigating away (cleanup)
  useEffect(() => {
    return () => {
      // Reset edit state on unmount/navigation
      setIsEditing(false);
      setEditedPerson(null);
    };
  }, [personId]);

  // Auto-translate function with debounce
  const autoTranslate = useCallback(async (
    englishText: string,
    fieldName: 'name' | 'relationship' | 'location' | 'favoriteFood' | 'about'
  ) => {
    if (!englishText || englishText.trim() === '') {
      return;
    }

    setTranslatingField(fieldName);
    try {
      const arabicText = await translateToArabic(englishText);
      const arabicFieldName = `${fieldName}Ar` as keyof Person;
      setEditedPerson(prev => ({
        ...prev,
        [arabicFieldName]: arabicText
      }));
    } catch (error) {
      console.error('Translation error:', error);
      // Silently fail - user can still manually enter Arabic text
    } finally {
      setTranslatingField(null);
    }
  }, []);

  // Debounce utility
  useEffect(() => {
    const timeouts: { [key: string]: NodeJS.Timeout } = {};
    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-sans text-text">Loading...</h1>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-sans text-text">Error loading person data</h1>
      </div>
    );
  }
  
  const person = personId ? getPersonById(personId) : null;
  
  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-sans text-text">{t('person_not_found', language)}</h1>
      </div>
    );
  }

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  const spouse = getSpouse(person.id);
  const children = getChildren(person.id);
  const familyMembers = [spouse, ...children].filter(Boolean) as Person[];

  const openModal = (startIndex: number = 0) => {
    setGalleryStartIndex(startIndex);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleEdit = () => {
    setEditedPerson(person);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedPerson(null);
    setIsEditing(false);
    setNewPrimaryPhoto(null);
    setNewPrimaryPhotoPreview('');
    setAdditionalPhotos([]);
    setPhotosToDelete([]);
  };

  // Handle primary photo change
  const handlePrimaryPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped primary photo
  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'cropped-photo.jpg', { type: 'image/jpeg' });
    setNewPrimaryPhoto(croppedFile);
    
    const previewURL = URL.createObjectURL(croppedBlob);
    setNewPrimaryPhotoPreview(previewURL);
    
    setShowCropDialog(false);
    setImageToCrop('');
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setImageToCrop('');
  };

  // Handle additional photos selection
  const handleAdditionalPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalPhotos(prev => [...prev, ...files]);
  };

  // Remove photo from additional photos list
  const removeAdditionalPhoto = (index: number) => {
    setAdditionalPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Mark an existing photo for deletion
  const markPhotoForDeletion = (photoUrl: string) => {
    setPhotosToDelete(prev => [...prev, photoUrl]);
  };

  // Unmark a photo for deletion
  const unmarkPhotoForDeletion = (photoUrl: string) => {
    setPhotosToDelete(prev => prev.filter(url => url !== photoUrl));
  };

  // Compress and upload a photo
  const compressAndUploadPhoto = async (file: File, personId: string): Promise<string> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);
    return await uploadPhoto(personId, compressedFile);
  };

  const handleDelete = async () => {
    if (!personId) return;
    
    try {
      // Delete all photos from storage
      if (person.photos && person.photos.length > 0) {
        await Promise.all(person.photos.map(photoUrl => deletePhoto(photoUrl)));
      }
      
      // Delete primary photo
      if (person.primaryPhoto) {
        await deletePhoto(person.primaryPhoto);
      }
      
      // Delete person document
      await deletePerson(personId);
      
      // Navigate back to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Failed to delete person. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!editedPerson || !personId) return;
    
    setIsUploadingPhotos(true);
    
    try {
      // Filter out undefined values - Firestore doesn't accept them
      const cleanedData: Partial<Person> = {};
      Object.entries(editedPerson).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key as keyof Person] = value as any;
        }
      });
      
      // Upload new primary photo if changed
      if (newPrimaryPhoto) {
        const primaryPhotoURL = await compressAndUploadPhoto(newPrimaryPhoto, personId);
        cleanedData.primaryPhoto = primaryPhotoURL;
      }

      // Delete photos marked for deletion
      if (photosToDelete.length > 0) {
        await Promise.all(
          photosToDelete.map(photoUrl => deletePhoto(photoUrl))
        );
      }

      // Upload additional photos if any and update photos array
      let updatedPhotos = (person.photos || []).filter(url => !photosToDelete.includes(url));
      
      if (additionalPhotos.length > 0) {
        const uploadPromises = additionalPhotos.map(file => 
          compressAndUploadPhoto(file, personId)
        );
        const newPhotoURLs = await Promise.all(uploadPromises);
        updatedPhotos = [...updatedPhotos, ...newPhotoURLs];
      }
      
      // Update photos array if there were any changes
      if (photosToDelete.length > 0 || additionalPhotos.length > 0) {
        cleanedData.photos = updatedPhotos;
      }
      
      // Update person document
      await updatePerson(personId, {
        ...cleanedData,
        updatedAt: new Date(),
      });
      
      // Reset state
      setIsEditing(false);
      setEditedPerson(null);
      setNewPrimaryPhoto(null);
      setNewPrimaryPhotoPreview('');
      setAdditionalPhotos([]);
      setPhotosToDelete([]);
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  return (
    <>
      <div 
        className="p-6 md:p-12 bg-background min-h-screen"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <LanguageToggle />
        
        {/* Edit button - next to language toggle */}
        {isRevealed && !isEditing && !isGameMode && (
          <button
            onClick={handleEdit}
            className="fixed top-6 right-20 z-40 bg-accent text-accent-text font-bold w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-110 flex items-center justify-center"
            aria-label="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        )}
        
        {/* Next button in game mode - visible but disabled until revealed */}
        {isGameMode && (
          <button
            onClick={handleNextPerson}
            disabled={!isRevealed}
            className="fixed top-6 right-20 z-40 bg-accent text-accent-text font-bold w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-110 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
            aria-label={language === 'ar' ? 'التالي' : 'Next'}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5} 
              stroke="currentColor" 
              className="w-6 h-6"
              style={{ transform: language === 'ar' ? 'scaleX(-1)' : 'none' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        )}
        
        {/* Save/Cancel buttons when editing */}
        {isEditing && !isGameMode && (
          <div className="fixed top-6 right-20 z-40 flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isUploadingPhotos}
              className="bg-card text-text font-bold w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:hidden">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden md:inline">Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isUploadingPhotos}
              className="bg-accent text-accent-text font-bold w-12 h-12 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save"
            >
              {isUploadingPhotos ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:hidden">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="hidden md:inline">Save</span>
                </>
              )}
            </button>
          </div>
        )}
        {/* Header with Back Button and Title/Button */}
        <div className="mb-8 max-w-7xl mx-auto">
          <div className="relative flex items-center">
            {!isGameMode && (
              <div className="absolute left-0">
                <BackButton />
              </div>
            )}
            {isGameMode && (
              <div className="absolute left-0">
                <button
                  onClick={handleExitGameMode}
                  className="bg-card text-accent text-2xl rounded-full w-14 h-14 flex items-center justify-center shadow-md transition-all duration-300 ease-out hover:shadow-lg hover:scale-105"
                  aria-label={language === 'ar' ? 'خروج من وضع اللعبة' : 'Exit Game Mode'}
                  title={language === 'ar' ? 'خروج من وضع اللعبة' : 'Exit Game Mode'}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5} 
                    stroke="currentColor" 
                    className="w-7 h-7"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="flex-1 flex justify-center">
              {!isRevealed && (
                <button
                  onClick={handleReveal}
                  className={`${fontClass} text-3xl md:text-4xl font-bold py-6 px-12 rounded-2xl shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-105 bg-accent text-accent-text animate-fade-in`}
                >
                  {t('whos_this', language)}
                </button>
              )}
              {isRevealed && (
                <div className="text-center animate-reveal-name">
                  <h2 className={`${fontClass} text-5xl md:text-6xl font-bold text-text`}>
                    {getPersonName(person, language)}
                  </h2>
                  <p className={`${fontClass} text-2xl md:text-3xl mt-2 text-accent`}>
                    {getRelationship(person, language)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          {!isRevealed ? (
            /* Initial State: Centered Photo */
            <div className="flex flex-col items-center gap-8 mt-12 animate-fade-in">
              <img
                src={person.primaryPhoto}
                alt={`Photo`}
                className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover shadow-xl transition-all duration-500 ease-out"
              />
            </div>
          ) : (
            /* Revealed State: Full Layout */
            <>

              {/* Profile + About Card */}
              <div className="bg-card rounded-3xl p-4 md:p-8 shadow-sm mt-4 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <div className={`flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
                  <div className="flex-1 w-full">
                    {!isEditing ? (
                      <>
                        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-lg md:text-xl text-text" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                          {person.birthday && (
                            <>
                              <span className={`${fontClass} font-semibold`}>{t('birthday', language)}</span>
                              <span className={fontClass}>{formatBirthdayDisplay(person.birthday, language)}</span>
                            </>
                          )}
                          
                          {person.birthday && (
                            <>
                              <span className={`${fontClass} font-semibold`}>{t('age', language)}</span>
                              <span className={fontClass}>{calculateAge(person.birthday)}</span>
                            </>
                          )}
                          
                          <span className={`${fontClass} font-semibold`}>{t('lives_in', language)}</span>
                          <span className={fontClass}>{getLocation(person, language)}</span>
                          
                          <span className={`${fontClass} font-semibold`}>{t('loves', language)}</span>
                          <span className={fontClass}>{getFavoriteFood(person, language)}</span>
                        </div>
                        
                        {/* More About section */}
                        {(person.about || person.aboutAr) && (
                          <div className="mt-6 pt-6 border-t border-accent/20">
                            <p className={`${fontClass} text-base md:text-lg text-text leading-relaxed`}>
                              {getAbout(person, language)}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Name - English & Arabic */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Name (English)</label>
                            <input
                              type="text"
                              value={editedPerson?.name || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, name: e.target.value})}
                              onBlur={(e) => autoTranslate(e.target.value, 'name')}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="Enter name in English"
                            />
                          </div>
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Name (Arabic)</label>
                            <input
                              type="text"
                              value={editedPerson?.nameAr || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, nameAr: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent font-arabic"
                              placeholder={translatingField === 'name' ? "Translating..." : "اكتب الاسم بالعربي"}
                            />
                          </div>
                        </div>

                        {/* Relationship - English & Arabic */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Relationship (English)</label>
                            <input
                              type="text"
                              value={editedPerson?.relationship || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, relationship: e.target.value})}
                              onBlur={(e) => autoTranslate(e.target.value, 'relationship')}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="e.g., your daughter, your son"
                            />
                          </div>
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Relationship (Arabic)</label>
                            <input
                              type="text"
                              value={editedPerson?.relationshipAr || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, relationshipAr: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent font-arabic"
                              placeholder={translatingField === 'relationship' ? "Translating..." : "مثلاً: ابنتك، ابنك"}
                            />
                          </div>
                        </div>

                        {/* Birthday */}
                        <div>
                          <label className={`${fontClass} font-semibold block mb-2`}>Birthday</label>
                          <input
                            type="date"
                            value={editedPerson?.birthday || ''}
                            onChange={(e) => setEditedPerson({...editedPerson, birthday: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        {/* Location - English & Arabic */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Location (English)</label>
                            <input
                              type="text"
                              value={editedPerson?.location || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, location: e.target.value})}
                              onBlur={(e) => autoTranslate(e.target.value, 'location')}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="e.g., Beirut, Dubai"
                            />
                          </div>
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Location (Arabic)</label>
                            <input
                              type="text"
                              value={editedPerson?.locationAr || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, locationAr: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent font-arabic"
                              placeholder={translatingField === 'location' ? "Translating..." : "مثلاً: بيروت، دبي"}
                            />
                          </div>
                        </div>

                        {/* Favorite Food - English & Arabic */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Favorite Food (English)</label>
                            <input
                              type="text"
                              value={editedPerson?.favoriteFood || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, favoriteFood: e.target.value})}
                              onBlur={(e) => autoTranslate(e.target.value, 'favoriteFood')}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                              placeholder="e.g., Kibbeh, Tabbouleh"
                            />
                          </div>
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>Favorite Food (Arabic)</label>
                            <input
                              type="text"
                              value={editedPerson?.favoriteFoodAr || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, favoriteFoodAr: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent font-arabic"
                              placeholder={translatingField === 'favoriteFood' ? "Translating..." : "مثلاً: كبة، تبولة"}
                            />
                          </div>
                        </div>

                        {/* More About - English & Arabic */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>More about {editedPerson?.name || 'this person'} (English)</label>
                            <textarea
                              value={editedPerson?.about || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, about: e.target.value})}
                              onBlur={(e) => autoTranslate(e.target.value, 'about')}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
                              placeholder="e.g., She loves gardening and plays piano..."
                            />
                          </div>
                          <div>
                            <label className={`${fontClass} font-semibold block mb-2`}>More about {editedPerson?.nameAr || editedPerson?.name || 'this person'} (Arabic)</label>
                            <textarea
                              value={editedPerson?.aboutAr || ''}
                              onChange={(e) => setEditedPerson({...editedPerson, aboutAr: e.target.value})}
                              className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent font-arabic min-h-[100px]"
                              placeholder={translatingField === 'about' ? "Translating..." : "مثلاً: تحب البستنة وتعزف البيانو..."}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Photo - with edit capability */}
                  <div className="shrink-0">
                    <div className="relative">
                      <img
                        src={newPrimaryPhotoPreview || person.primaryPhoto}
                        alt={`Main photo of ${getPersonName(person, language)}`}
                        className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover shadow-lg cursor-pointer transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl"
                        onClick={isEditing ? undefined : () => openModal(0)}
                      />
                      {isEditing && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                            <span className="text-sm font-semibold">{t('change_photo', language)}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePrimaryPhotoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                      
                      {/* Gallery indicator badge - show when there are additional photos */}
                      {!isEditing && person.photos && person.photos.length > 0 && (
                        <div className="absolute bottom-2 right-2 bg-accent text-accent-text rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Photos Section - Only in edit mode */}
                {isEditing && (
                  <div className="mt-6 pt-6 border-t border-accent/20">
                    <h4 className={`${fontClass} text-xl font-semibold mb-4 text-text`}>{t('additional_photos', language)}</h4>
                    
                    {/* Upload button */}
                    <label className="inline-block cursor-pointer mb-4">
                      <div className="bg-accent/10 border-2 border-dashed border-accent rounded-lg px-6 py-3 hover:bg-accent/20 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-accent">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span className={`${fontClass} text-accent font-semibold`}>{t('add_photos', language)}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalPhotosChange}
                        className="hidden"
                      />
                    </label>

                    {/* Existing photos - can be deleted */}
                    {person.photos && person.photos.length > 0 && (
                      <div className="mb-6">
                        <h5 className={`${fontClass} text-sm font-semibold mb-2 text-text/70`}>
                          {language === 'ar' ? 'الصور الحالية' : 'Current Photos'}
                        </h5>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                          {person.photos.map((photoUrl, index) => {
                            const isMarkedForDeletion = photosToDelete.includes(photoUrl);
                            return (
                              <div key={index} className="relative group">
                                <img
                                  src={photoUrl}
                                  alt={`Existing ${index + 1}`}
                                  className={`w-full aspect-square object-cover rounded-lg shadow-md transition-opacity ${
                                    isMarkedForDeletion ? 'opacity-30' : ''
                                  }`}
                                />
                                <button
                                  onClick={() => 
                                    isMarkedForDeletion 
                                      ? unmarkPhotoForDeletion(photoUrl)
                                      : markPhotoForDeletion(photoUrl)
                                  }
                                  className={`absolute top-2 right-2 rounded-full w-8 h-8 flex items-center justify-center transition-all ${
                                    isMarkedForDeletion
                                      ? 'bg-yellow-500 text-white opacity-100'
                                      : 'bg-red-500 text-white opacity-0 group-hover:opacity-100'
                                  }`}
                                  aria-label={isMarkedForDeletion ? 'Undo delete' : 'Delete photo'}
                                  title={isMarkedForDeletion ? 'Click to undo' : 'Delete photo'}
                                >
                                  {isMarkedForDeletion ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </button>
                                {isMarkedForDeletion && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                      {language === 'ar' ? 'سيتم الحذف' : 'Will delete'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Preview of photos being added */}
                    {additionalPhotos.length > 0 && (
                      <div>
                        <h5 className={`${fontClass} text-sm font-semibold mb-2 text-text/70`}>
                          {language === 'ar' ? 'صور جديدة للإضافة' : 'New Photos to Add'}
                        </h5>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                        {additionalPhotos.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg shadow-md"
                            />
                            <button
                              onClick={() => removeAdditionalPhoto(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove photo"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Person Button */}
                    <div className="mt-8 pt-6 border-t border-red-200">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        {language === 'ar' ? 'حذف هذا الشخص' : 'Delete This Person'}
                      </button>
                      <p className={`${fontClass} text-sm text-red-600 mt-2`}>
                        {language === 'ar' ? 'تحذير: لا يمكن التراجع عن هذا الإجراء' : 'Warning: This action cannot be undone'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Family Card - Only show after reveal */}
          {isRevealed && familyMembers.length > 0 && (
            <div className="bg-card rounded-3xl p-8 shadow-sm animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <h3 className={`${fontClass} text-3xl font-bold mb-6 text-text`}>{t('family_section', language)}</h3>
              <div className="flex gap-6 pb-4 flex-wrap">
                {familyMembers.map((member) => (
                  <FamilyLinkCard key={member.id} person={member} showRelationship={member.id === spouse?.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {isModalOpen && (
        <PhotoGalleryModal
          photos={[person.primaryPhoto, ...(person.photos || [])]}
          initialIndex={galleryStartIndex}
          personName={getPersonName(person, language)}
          onClose={closeModal}
        />
      )}

      {/* Image Crop Dialog */}
      {showCropDialog && imageToCrop && (
        <ImageCropDialog
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className={`${fontClass} text-2xl font-bold text-text`}>
                {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
              </h3>
            </div>
            
            <p className={`${fontClass} text-lg text-text mb-6`}>
              {language === 'ar' 
                ? `هل أنت متأكد أنك تريد حذف ${getPersonName(person, language)}؟ سيتم حذف جميع الصور والبيانات بشكل نهائي.`
                : `Are you sure you want to delete ${getPersonName(person, language)}? All photos and data will be permanently removed.`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`${fontClass} flex-1 bg-card text-text px-6 py-3 rounded-lg hover:bg-accent/10 transition-colors font-semibold`}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                className={`${fontClass} flex-1 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold`}
              >
                {language === 'ar' ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
