import { Person } from '../types';

type Language = 'en' | 'ar';

// Person data getters
export const getPersonName = (person: Person, language: Language): string => {
  return language === 'ar' ? person.nameAr : person.name;
};

export const getRelationship = (person: Person, language: Language): string => {
  return language === 'ar' ? person.relationshipAr : person.relationship;
};

export const getLocation = (person: Person, language: Language): string | undefined => {
  return language === 'ar' ? (person.locationAr || person.location) : person.location;
};

export const getFavoriteFood = (person: Person, language: Language): string | undefined => {
  return language === 'ar' ? (person.favoriteFoodAr || person.favoriteFood) : person.favoriteFood;
};

export const getAbout = (person: Person, language: Language): string | undefined => {
  return language === 'ar' ? (person.aboutAr || person.about) : person.about;
};

export const getFacts = (person: Person, language: Language): string[] | undefined => {
  return language === 'ar' ? (person.factsAr || person.facts) : person.facts;
};

// UI translations
export const t = (key: string, language: Language): string => {
  const translations: Record<string, { en: string; ar: string }> = {
    // Common
    'family': { en: 'Sadder Family', ar: 'بيت صدّر' },
    'family_of': { en: "'s Family", ar: 'عائلة ' },
    
    // Person Detail
    'whos_this': { en: "Who's this?", ar: 'هيدا مين؟' },
    'birthday': { en: 'Birthday:', ar: 'تاريخ الميلاد:' },
    'age': { en: 'Age:', ar: 'العمر:' },
    'lives_in': { en: 'Lives in:', ar: 'يسكن في:' },
    'loves': { en: 'Loves:', ar: 'يحب:' },
    'family_section': { en: 'Family', ar: 'العائلة' },
    
    // Navigation
    'back': { en: 'Go Back', ar: 'رجوع' },
    'person_not_found': { en: 'Person not found.', ar: '.الشخص غير موجود' },
    
    // Add Person
    'add_person': { en: 'Add Family Member', ar: 'إضافة فرد من العائلة' },
    'photo': { en: 'Photo', ar: 'صورة' },
    'upload_photo': { en: 'Upload Photo', ar: 'تحميل صورة' },
    'change_photo': { en: 'Change Photo', ar: 'تغيير الصورة' },
    'additional_photos': { en: 'Additional Photos', ar: 'صور إضافية' },
    'add_photos': { en: 'Add Photos', ar: 'إضافة صور' },
    
    // Gallery Mode
    'gallery_mode': { en: 'Gallery', ar: 'وضع المعرض' },
    'loading': { en: 'Loading...', ar: 'جاري التحميل...' },
    'error_loading': { en: 'Error loading photos', ar: 'خطأ في تحميل الصور' },
    'no_photos': { en: 'No photos available', ar: 'لا توجد صور متاحة' },
    'back_to_hub': { en: 'Back to Hub', ar: 'العودة إلى الصفحة الرئيسية' },
    'pull_to_exit': { en: 'Pull down to exit', ar: 'اسحب للأسفل للخروج' },
  };

  return translations[key]?.[language] || key;
};

