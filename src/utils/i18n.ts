import { Person } from '../types';

type Language = 'en' | 'ar';

// Person data getters
export const getPersonName = (person: Person, language: Language): string => {
  return language === 'ar' ? person.nameAr : person.name;
};

export const getRelationship = (person: Person, language: Language): string => {
  return language === 'ar' ? person.relationship : person.relationshipEn;
};

export const getLocation = (person: Person, language: Language): string | undefined => {
  return language === 'ar' ? (person.locationAr || person.location) : person.location;
};

export const getFavoriteFood = (person: Person, language: Language): string | undefined => {
  return language === 'ar' ? (person.favoriteFoodAr || person.favoriteFood) : person.favoriteFood;
};

export const getFacts = (person: Person, language: Language): string[] | undefined => {
  return language === 'ar' ? (person.factsAr || person.facts) : person.facts;
};

// UI translations
export const t = (key: string, language: Language): string => {
  const translations: Record<string, { en: string; ar: string }> = {
    // Common
    'family': { en: 'Sadder Family', ar: 'بيت صضّر' },
    'family_of': { en: "'s Family", ar: 'عائلة ' },
    
    // Person Detail
    'whos_this': { en: "Who's this?", ar: 'هايدا مين؟' },
    'birthday': { en: 'Birthday:', ar: ':تاريخ الميلاد' },
    'age': { en: 'Age:', ar: ':العمر' },
    'lives_in': { en: 'Lives in:', ar: ':يسكن في' },
    'loves': { en: 'Loves:', ar: ':يحب' },
    'family_section': { en: 'Family', ar: 'العائلة' },
    
    // Navigation
    'back': { en: 'Go Back', ar: 'رجوع' },
    'person_not_found': { en: 'Person not found.', ar: '.الشخص غير موجود' },
  };

  return translations[key]?.[language] || key;
};

