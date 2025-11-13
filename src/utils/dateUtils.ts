import { Language } from '../context/LanguageContext';

/**
 * Format date as "X years ago" or localized equivalent
 */
export const getTimeAgo = (date: Date, language: Language): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffYears > 0) {
    if (language === 'ar') {
      return diffYears === 1 ? 'منذ سنة' : `منذ ${diffYears} سنوات`;
    }
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } else if (diffMonths > 0) {
    if (language === 'ar') {
      return diffMonths === 1 ? 'منذ شهر' : `منذ ${diffMonths} أشهر`;
    }
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffDays > 0) {
    if (language === 'ar') {
      return diffDays === 1 ? 'منذ يوم' : `منذ ${diffDays} أيام`;
    }
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return language === 'ar' ? 'اليوم' : 'Today';
  }
};

