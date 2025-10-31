import { Link } from 'react-router-dom';
import { Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getPersonName, getRelationship } from '../utils/i18n';

interface FamilyLinkCardProps {
  person: Person;
  showRelationship?: boolean;
}

const FamilyLinkCard = ({ person, showRelationship = false }: FamilyLinkCardProps) => {
  const { language } = useLanguage();
  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  return (
    <Link to={`/person/${person.id}`} className="block w-40 shrink-0">
      <div className="rounded-xl overflow-hidden shadow-md transition-all duration-300 ease-out hover:shadow-xl hover:scale-105">
        <img src={person.primaryPhoto} alt={`Photo of ${getPersonName(person, language)}`} className="w-full aspect-square object-cover" />
        <div className="p-3 bg-white">
          <p className={`${fontClass} text-2xl font-bold text-center text-text truncate`}>
            {getPersonName(person, language)}
          </p>
          {showRelationship && (
             <p className={`${fontClass} text-lg text-center text-accent`}>
              {getRelationship(person, language)}
             </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default FamilyLinkCard;
