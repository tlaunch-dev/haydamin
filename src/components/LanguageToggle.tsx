import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-6 right-6 z-50 bg-accent text-accent-text font-bold text-xl w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-110"
      aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      {language === 'en' ? 'En' : 'ع'}
    </button>
  );
};

export default LanguageToggle;

