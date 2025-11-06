import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'haydamin_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (saved === 'en' || saved === 'ar') ? saved : 'en';
  });

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const newLang = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      return newLang;
    });
  }, []);

  const value = useMemo(
    () => ({ language, toggleLanguage }),
    [language, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

