import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../utils/i18n';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const handleBack = () => {
    // Reason: Prevent navigation if already on home page to avoid going back outside the app
    if (location.pathname === '/') {
      return;
    }

    // Reason: Use React Router's built-in history navigation
    // This respects the actual navigation history rather than hardcoding routes
    navigate(-1);
  };

  return (
    <button
      onClick={handleBack}
      className="bg-card text-accent text-2xl rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-md transition-all duration-300 ease-out hover:shadow-lg hover:scale-105"
      aria-label={t('back', language)}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={2.5} 
        stroke="currentColor" 
        className="w-7 h-7 md:w-8 md:h-8"
        style={{ transform: language === 'ar' ? 'scaleX(-1)' : 'none' }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
    </button>
  );
};

export default BackButton;
