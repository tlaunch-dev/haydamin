import { memo } from 'react';
import { Person } from '../types';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getPersonName } from '../utils/i18n';

interface PersonCardProps {
  person: Person;
  variant?: 'hub' | 'thumbnail';
  isRootLevel?: boolean;
  showName?: boolean;
}

const PersonCard = ({ person, variant = 'hub', isRootLevel = false, showName = true }: PersonCardProps) => {
  const { language } = useLanguage();
  const hasChildren = person.childrenIds && person.childrenIds.length > 0;
  const hasSpouse = !!person.spouseId;

  // Navigate to hub if person has spouse or children AND is not at root level
  // Otherwise go to person detail page
  const linkTo = ((hasSpouse || hasChildren) && !isRootLevel) ? `/hub/${person.id}` : `/person/${person.id}`;

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  // Both hub and thumbnail variants with names: circular with name underneath
  if (showName) {
    const nameSize = variant === 'hub' ? 'text-xl md:text-2xl' : 'text-lg md:text-xl';

    return (
      <Link
        to={linkTo}
        className="flex flex-col items-center gap-3 transition-all duration-500 ease-out hover:scale-105"
      >
        <div className="p-1 bg-white rounded-full shadow-xl transition-all duration-500 ease-out">
          <img
            src={person.primaryPhoto}
            alt={`Photo of ${getPersonName(person, language)}`}
            loading="lazy"
            className="aspect-square object-cover w-full rounded-full ring-2 ring-accent/30 transition-all duration-500 ease-out bg-gray-100"
          />
        </div>
        <h2 className={`${fontClass} font-light text-accent ${nameSize} text-center leading-tight transition-all duration-500 ease-out`}>
          {getPersonName(person, language)}
        </h2>
      </Link>
    );
  }

  // Hidden names: circular only
  return (
    <Link
      to={linkTo}
      className="transition-all duration-500 ease-out hover:scale-110 block"
    >
      <div className="p-1 bg-white rounded-full shadow-xl transition-all duration-500 ease-out">
        <img
          src={person.primaryPhoto}
          alt={`Photo of ${getPersonName(person, language)}`}
          loading="lazy"
          className="aspect-square object-cover w-full rounded-full ring-2 ring-accent/30 transition-all duration-500 ease-out bg-gray-100"
        />
      </div>
    </Link>
  );
};

// Custom comparison function for memo
// Only re-render if person data, variant, isRootLevel, or showName actually changes
const areEqual = (prevProps: PersonCardProps, nextProps: PersonCardProps) => {
  return (
    prevProps.person.id === nextProps.person.id &&
    prevProps.person.primaryPhoto === nextProps.person.primaryPhoto &&
    prevProps.person.spouseId === nextProps.person.spouseId &&
    JSON.stringify(prevProps.person.childrenIds) === JSON.stringify(nextProps.person.childrenIds) &&
    prevProps.person.name === nextProps.person.name &&
    prevProps.person.nameAr === nextProps.person.nameAr &&
    prevProps.variant === nextProps.variant &&
    prevProps.isRootLevel === nextProps.isRootLevel &&
    prevProps.showName === nextProps.showName
  );
};

export default memo(PersonCard, areEqual);
