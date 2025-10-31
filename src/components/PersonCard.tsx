import { Person } from '../types';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getPersonName } from '../utils/i18n';

interface PersonCardProps {
  person: Person;
  variant?: 'hub' | 'thumbnail';
  isRootLevel?: boolean;
}

const PersonCard = ({ person, variant = 'hub', isRootLevel = false }: PersonCardProps) => {
  const { language } = useLanguage();
  const hasChildren = person.childrenIds && person.childrenIds.length > 0;

  const cardClasses =
    variant === 'hub'
      ? 'family-hub-card w-44 md:w-52'
      : 'family-thumbnail-card w-32 md:w-40';

  const textContainerClasses = variant === 'hub' ? 'p-4' : 'p-3';
  const nameClasses =
    variant === 'hub' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl';

  // Navigate to hub if person has children AND is not at root level
  // Otherwise go to person detail page
  const linkTo = (hasChildren && !isRootLevel) ? `/hub/${person.id}` : `/person/${person.id}`;

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  return (
    <Link to={linkTo} className={`${cardClasses} bg-white rounded-2xl shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 block`}>
      <div className="relative">
        <img src={person.primaryPhoto} alt={`Photo of ${getPersonName(person, language)}`} className="aspect-square object-cover w-full rounded-t-2xl" />
      </div>
      <div className={`${textContainerClasses} text-center`}>
        <h2 className={`${fontClass} font-bold text-text ${nameClasses}`}>
          {getPersonName(person, language)}
        </h2>
      </div>
    </Link>
  );
};

export default PersonCard;
