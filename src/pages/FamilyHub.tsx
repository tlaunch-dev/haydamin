import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PersonCard from '../components/PersonCard';
import AddPersonCard from '../components/AddPersonCard';
import BackButton from '../components/BackButton';
import { CollapsibleButtonMenu, ButtonConfig } from '../components/CollapsibleButtonMenu';
import { useLanguage } from '../context/LanguageContext';
import { usePeople } from '../hooks/usePeople';
import { Person } from '../types';
import { getPersonName, t } from '../utils/i18n';
import { Globe, Eye, EyeOff, Pencil, Dices } from 'lucide-react';

const FamilyHub = () => {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { people, loading, error } = usePeople();
  const [showNames, setShowNames] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Get root person IDs from environment
  const ROOT_PERSON_1 = import.meta.env.VITE_ROOT_PERSON_ID_1 || 'teta-1';
  const ROOT_PERSON_2 = import.meta.env.VITE_ROOT_PERSON_ID_2 || 'jiddo-1';
  
  // Helper functions to query people array
  const getPersonById = (id: string): Person | undefined => {
    return people.find(p => p.id === id);
  };
  
  const getSpouse = (id: string): Person | undefined => {
    const person = getPersonById(id);
    if (!person?.spouseId) return undefined;
    return getPersonById(person.spouseId);
  };
  
  const getChildren = (id: string): Person[] => {
    const person = getPersonById(id);
    if (!person?.childrenIds) return [];
    return person.childrenIds.map(childId => getPersonById(childId)).filter(Boolean) as Person[];
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-sans text-text">Loading...</h1>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-sans text-text">Error loading family data</h1>
      </div>
    );
  }
  
  // Determine who to display based on route
  const isRootHub = !personId;
  
  let centerPerson, spousePerson, childrenList;
  
  if (isRootHub) {
    // Root hub: show both root people at top
    centerPerson = getPersonById(ROOT_PERSON_1);
    spousePerson = getPersonById(ROOT_PERSON_2);
    childrenList = centerPerson ? getChildren(centerPerson.id) : [];
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
  
  if (!centerPerson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-sans text-text">{t('person_not_found', language)}</h1>
      </div>
    );
  }

  const headerText = isRootHub 
    ? t('family', language)
    : language === 'ar'
      ? `${t('family_of', language)}${getPersonName(centerPerson, language)}`
      : `${getPersonName(centerPerson, language)}${t('family_of', language)}`;

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  // Handle game mode button click
  const handleGameMode = () => {
    if (people.length === 0) return;
    // Reset shown people list when starting a new game
    localStorage.removeItem('haydamin_game_mode_shown_ids');
    // Select a random person
    const randomPerson = people[Math.floor(Math.random() * people.length)];
    navigate(`/person/${randomPerson.id}?game=true`);
  };

  // Handle language toggle
  const { toggleLanguage } = useLanguage();

  // Configure menu buttons
  const menuButtons: ButtonConfig[] = [
    {
      id: 'game-mode',
      icon: <Dices className="w-5 h-5 text-accent" />,
      label: language === 'ar' ? 'وضع اللعبة' : 'Game Mode',
      onClick: handleGameMode,
      show: people.length > 0,
    },
    {
      id: 'edit-mode',
      icon: <Pencil className="w-5 h-5 text-accent" />,
      label: isEditMode ? 'Exit edit mode' : 'Enter edit mode',
      onClick: () => setIsEditMode(!isEditMode),
    },
    {
      id: 'toggle-names',
      icon: showNames ? <Eye className="w-5 h-5 text-accent" /> : <EyeOff className="w-5 h-5 text-accent" />,
      label: showNames ? 'Hide names' : 'Show names',
      onClick: () => setShowNames(!showNames),
    },
    {
      id: 'language',
      icon: <Globe className="w-5 h-5 text-accent" />,
      label: language === 'ar' ? 'العربية' : 'English',
      onClick: toggleLanguage,
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-12 pt-20 sm:pt-24 md:pt-6 bg-background min-h-screen flex flex-col justify-center">
      <CollapsibleButtonMenu buttons={menuButtons} />

      {/* Back button - aligned with hamburger */}
      {!isRootHub && (
        <div className="fixed top-6 left-6 z-50">
          <BackButton />
        </div>
      )}

      {/* Header */}
      <div className="mb-8 md:mb-10 lg:mb-12 max-w-7xl mx-auto w-full">
        <div className="text-center">
          <h1 className={`${fontClass} text-5xl md:text-6xl font-bold text-text`}>{headerText}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        {/* Center Person(s) Row - Always side by side */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-row justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <div className="w-[45%] sm:w-[40%] md:w-52 lg:w-60 min-w-[120px] max-w-[200px]">
              <PersonCard person={centerPerson} variant="hub" isRootLevel={true} showName={showNames} />
            </div>
            {spousePerson && (
              <div className="w-[45%] sm:w-[40%] md:w-52 lg:w-60 min-w-[120px] max-w-[200px]">
                <PersonCard person={spousePerson} variant="hub" isRootLevel={true} showName={showNames} />
              </div>
            )}
            {/* Add Spouse Card - only show in edit mode when no spouse exists */}
            {isEditMode && !spousePerson && (
              <div className="w-[45%] sm:w-[40%] md:w-52 lg:w-60 min-w-[120px] max-w-[200px]">
                <AddPersonCard
                  spouseId={centerPerson.id}
                  variant="spouse"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tree Connector */}
        {(childrenList.length > 0 || isEditMode) && (
          <div className="h-8 md:h-12 w-1 bg-accent opacity-30 mx-auto mb-4 md:mb-6"></div>
        )}

        {/* Children Row - Grid on mobile, horizontal scroll on iPad+ */}
        {(childrenList.length > 0 || isEditMode) && (
          <div>
            {/* Mobile: 2-column grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:hidden justify-items-center max-w-md mx-auto">
              {childrenList.map((child) => (
                <PersonCard key={child.id} person={child} variant="thumbnail" showName={showNames} />
              ))}
              {/* Add Person Card - only show in edit mode */}
              {isEditMode && (
                <AddPersonCard
                  parentIds={spousePerson ? [centerPerson.id, spousePerson.id] : [centerPerson.id]}
                />
              )}
            </div>

            {/* iPad+: Horizontal scroll */}
            <div className="hidden md:block overflow-x-auto relative">
              <div className="flex justify-center gap-4 min-w-min px-4">
                {childrenList.map((child) => (
                  <PersonCard key={child.id} person={child} variant="thumbnail" showName={showNames} />
                ))}
                {/* Add Person Card - only show in edit mode */}
                {isEditMode && (
                  <AddPersonCard
                    parentIds={spousePerson ? [centerPerson.id, spousePerson.id] : [centerPerson.id]}
                  />
                )}
              </div>
              {/* Scroll fade indicator on right edge */}
              {childrenList.length > 4 && (
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyHub;
