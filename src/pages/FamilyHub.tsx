import { useParams } from 'react-router-dom';
import PersonCard from '../components/PersonCard';
import BackButton from '../components/BackButton';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { grandmother, grandfather, getChildren, getPersonById, getSpouse } from '../data/mockFamily';
import { getPersonName, t } from '../utils/i18n';

const FamilyHub = () => {
  const { personId } = useParams<{ personId: string }>();
  const { language } = useLanguage();
  
  // Determine who to display based on route
  // If no personId, show grandparents (root hub)
  // If personId, show that person + spouse + children
  const isRootHub = !personId;
  
  let centerPerson, spousePerson, childrenList;
  
  if (isRootHub) {
    // Root hub: show both grandparents at top
    centerPerson = grandmother;
    spousePerson = grandfather;
    childrenList = getChildren(grandmother.id);
  } else {
    // Individual hub: show person, their spouse, and their children
    centerPerson = getPersonById(personId);
    if (!centerPerson) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <h1 className="text-2xl font-sans text-text">{t('person_not_found', language)}</h1>
        </div>
      );
    }
    spousePerson = getSpouse(personId);
    childrenList = getChildren(personId);
  }

  const headerText = isRootHub 
    ? t('family', language)
    : language === 'ar'
      ? `${t('family_of', language)}${getPersonName(centerPerson, language)}`
      : `${getPersonName(centerPerson, language)}${t('family_of', language)}`;

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  return (
    <div className="p-6 md:p-12 bg-background min-h-screen">
      <LanguageToggle />
      {/* Header with optional back button */}
      <div className="mb-8 max-w-7xl mx-auto relative">
        {!isRootHub && (
          <div className="absolute left-0 top-0">
            <BackButton />
          </div>
        )}
        <div className="text-center">
          <h1 className={`${fontClass} text-5xl md:text-6xl font-bold text-text`}>{headerText}</h1>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* Center Person(s) Row */}
        <div className="mb-6">
          <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
            <PersonCard person={centerPerson} variant="hub" isRootLevel={true} />
            {spousePerson && <PersonCard person={spousePerson} variant="hub" isRootLevel={true} />}
          </div>
        </div>

        {/* Tree Connector */}
        {childrenList.length > 0 && (
          <div className="h-12 w-1 bg-accent opacity-30 mx-auto mb-6"></div>
        )}

        {/* Children Row - Single Line */}
        {childrenList.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex justify-center gap-3 md:gap-4 min-w-min px-4">
              {childrenList.map((child) => (
                <PersonCard key={child.id} person={child} variant="thumbnail" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyHub;
