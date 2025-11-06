import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { addPerson, updatePerson } from '../services/firestore';
import { uploadPhoto } from '../services/storage';
import { translateToArabic } from '../services/translate';
import BackButton from '../components/BackButton';
import { CollapsibleButtonMenu, ButtonConfig } from '../components/CollapsibleButtonMenu';
import ImageCropDialog from '../components/ImageCropDialog';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/i18n';
import { Person } from '../types';
import { Save, X } from 'lucide-react';

export function AddPerson() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Person>>({
    name: '',
    nameAr: '',
    relationship: '',
    relationshipAr: '',
    location: '',
    locationAr: '',
    favoriteFood: '',
    favoriteFoodAr: '',
    about: '',
    aboutAr: '',
    birthday: '',
    spouseId: null,
    parentIds: [],
    childrenIds: [],
    photos: [],
  });

  // Get relationship info from navigation state (if coming from family hub)
  useEffect(() => {
    const state = location.state as { parentIds?: string[]; spouseId?: string } | null;
    if (state?.parentIds) {
      setFormData(prev => ({
        ...prev,
        parentIds: state.parentIds
      }));
    }
    if (state?.spouseId) {
      setFormData(prev => ({
        ...prev,
        spouseId: state.spouseId
      }));
    }
  }, [location.state]);

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  // Auto-translate function
  const autoTranslate = async (
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
      setFormData(prev => ({
        ...prev,
        [arabicFieldName]: arabicText
      }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslatingField(null);
    }
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Read file and show crop dialog
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image
  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to File
    const croppedFile = new File([croppedBlob], 'cropped-photo.jpg', { type: 'image/jpeg' });
    setPhotoFile(croppedFile);
    
    // Create preview
    const previewURL = URL.createObjectURL(croppedBlob);
    setPhotoPreview(previewURL);
    
    // Close dialog
    setShowCropDialog(false);
    setImageToCrop('');
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropDialog(false);
    setImageToCrop('');
  };

  // Compress and upload photo
  const compressAndUploadPhoto = async (file: File, personId: string): Promise<string> => {
    try {
      // Compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      console.log('Original file size:', file.size / 1024 / 1024, 'MB');
      const compressedFile = await imageCompression(file, options);
      console.log('Compressed file size:', compressedFile.size / 1024 / 1024, 'MB');

      // Upload to Firebase Storage (correct parameter order: personId, file)
      const photoURL = await uploadPhoto(personId, compressedFile);
      return photoURL;
    } catch (error) {
      console.error('Error compressing/uploading photo:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!formData.name?.trim()) {
      alert('Please enter a name in English');
      return;
    }
    if (!formData.nameAr?.trim()) {
      alert('Please enter a name in Arabic');
      return;
    }
    if (!photoFile) {
      alert('Please select a photo');
      return;
    }

    setIsSaving(true);

    try {
      // Create person document first (to get the ID)
      const tempPhotoURL = 'https://via.placeholder.com/400'; // Temporary placeholder
      
      const personData: Omit<Person, 'id'> = {
        name: formData.name || '',
        nameAr: formData.nameAr || '',
        relationship: formData.relationship || '',
        relationshipAr: formData.relationshipAr || '',
        primaryPhoto: tempPhotoURL,
        photos: [],
        spouseId: formData.spouseId || null,
        parentIds: formData.parentIds || [],
        childrenIds: formData.childrenIds || [],
        birthday: formData.birthday || undefined,
        location: formData.location || undefined,
        locationAr: formData.locationAr || undefined,
        favoriteFood: formData.favoriteFood || undefined,
        favoriteFoodAr: formData.favoriteFoodAr || undefined,
        about: formData.about || undefined,
        aboutAr: formData.aboutAr || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add person to Firestore
      const personId = await addPerson(personData);

      // Upload and compress photo
      const photoURL = await compressAndUploadPhoto(photoFile, personId);

      // Update person with real photo URL
      await updatePerson(personId, { primaryPhoto: photoURL });

      // Update parents' childrenIds arrays
      if (formData.parentIds && formData.parentIds.length > 0) {
        const { updateParentChildrenIds } = await import('../services/firestore');
        for (const parentId of formData.parentIds) {
          await updateParentChildrenIds(parentId, personId);
        }
      }

      // Link spouse bidirectionally
      if (formData.spouseId) {
        await updatePerson(formData.spouseId, { 
          spouseId: personId,
          updatedAt: new Date()
        });
      }

      // Navigate to the new person's detail page
      navigate(`/person/${personId}`);
    } catch (error) {
      console.error('Error adding person:', error);
      alert('Failed to add person. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Handle language toggle
  const { toggleLanguage } = useLanguage();

  // Configure menu buttons
  const menuButtons: ButtonConfig[] = [
    {
      id: 'cancel',
      icon: <X className="w-5 h-5 text-text" />,
      label: 'Cancel',
      onClick: handleCancel,
    },
    {
      id: 'save',
      icon: isSaving ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <Save className="w-5 h-5 text-accent" />
      ),
      label: 'Save',
      onClick: handleSubmit,
    },
    {
      id: 'language',
      icon: <span className="text-accent font-bold text-lg">{language === 'ar' ? 'EN' : 'ع'}</span>,
      label: language === 'ar' ? 'English' : 'العربية',
      onClick: toggleLanguage,
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-12 pt-20 sm:pt-24 md:pt-6 bg-background min-h-screen relative overflow-hidden">
      <CollapsibleButtonMenu buttons={menuButtons} />

      {/* Back button - aligned with hamburger */}
      <div className="fixed safe-top safe-left z-50">
        <BackButton />
      </div>

      {/* Header */}
      <div className="mb-4 md:mb-6 lg:mb-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className={`${fontClass} text-5xl md:text-6xl font-bold text-text`}>
            {t('add_person', language)}
          </h2>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-3xl p-4 md:p-6 lg:p-8 shadow-sm">
          
          {/* Photo Upload */}
          <div className="mb-8 text-center">
            <label className={`${fontClass} font-semibold block mb-4 text-xl`}>
              {t('photo', language)}
            </label>
            
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover shadow-lg mx-auto"
                />
                <button
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview('');
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  aria-label="Remove photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-accent/10 border-4 border-dashed border-accent flex items-center justify-center mx-auto hover:bg-accent/20 transition-colors">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-accent mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className={`${fontClass} text-accent font-semibold`}>
                      {t('upload_photo', language)}
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Name - English & Arabic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>Name (English)</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onBlur={(e) => autoTranslate(e.target.value, 'name')}
                  className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter name in English"
                />
              </div>
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>Name (Arabic)</label>
                <input
                  type="text"
                  value={formData.nameAr || ''}
                  onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
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
                  value={formData.relationship || ''}
                  onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                  onBlur={(e) => autoTranslate(e.target.value, 'relationship')}
                  className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., your daughter, your son"
                />
              </div>
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>Relationship (Arabic)</label>
                <input
                  type="text"
                  value={formData.relationshipAr || ''}
                  onChange={(e) => setFormData({...formData, relationshipAr: e.target.value})}
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
                value={formData.birthday || ''}
                onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Location - English & Arabic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>Location (English)</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  onBlur={(e) => autoTranslate(e.target.value, 'location')}
                  className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Beirut, Dubai"
                />
              </div>
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>Location (Arabic)</label>
                <input
                  type="text"
                  value={formData.locationAr || ''}
                  onChange={(e) => setFormData({...formData, locationAr: e.target.value})}
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
                  value={formData.favoriteFood || ''}
                  onChange={(e) => setFormData({...formData, favoriteFood: e.target.value})}
                  onBlur={(e) => autoTranslate(e.target.value, 'favoriteFood')}
                  className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Kibbeh, Tabbouleh"
                />
              </div>
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>Favorite Food (Arabic)</label>
                <input
                  type="text"
                  value={formData.favoriteFoodAr || ''}
                  onChange={(e) => setFormData({...formData, favoriteFoodAr: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent font-arabic"
                  placeholder={translatingField === 'favoriteFood' ? "Translating..." : "مثلاً: كبة، تبولة"}
                />
              </div>
            </div>

            {/* More About - English & Arabic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>More about {formData.name || 'this person'} (English)</label>
                <textarea
                  value={formData.about || ''}
                  onChange={(e) => setFormData({...formData, about: e.target.value})}
                  onBlur={(e) => autoTranslate(e.target.value, 'about')}
                  className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px]"
                  placeholder="e.g., She loves gardening and plays piano..."
                />
              </div>
              <div>
                <label className={`${fontClass} font-semibold block mb-2`}>More about {formData.nameAr || formData.name || 'this person'} (Arabic)</label>
                <textarea
                  value={formData.aboutAr || ''}
                  onChange={(e) => setFormData({...formData, aboutAr: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent font-arabic min-h-[100px]"
                  placeholder={translatingField === 'about' ? "Translating..." : "مثلاً: تحب البستنة وتعزف البيانو..."}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Dialog */}
      {showCropDialog && imageToCrop && (
        <ImageCropDialog
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

