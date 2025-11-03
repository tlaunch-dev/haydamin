import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PersonCard from '../components/PersonCard';
import AddPersonCard from '../components/AddPersonCard';
import BackButton from '../components/BackButton';
import CedarBackground from '../components/CedarBackground';
import { CollapsibleButtonMenu, ButtonConfig } from '../components/CollapsibleButtonMenu';
import { useLanguage } from '../context/LanguageContext';
import { usePeople } from '../hooks/usePeople';
import { Person } from '../types';
import { getPersonName, t } from '../utils/i18n';
import { Eye, EyeOff, Pencil, Dices } from 'lucide-react';

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
      icon: <span className="text-accent font-bold text-lg">{language === 'ar' ? 'EN' : 'ع'}</span>,
      label: language === 'ar' ? 'English' : 'العربية',
      onClick: toggleLanguage,
    },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-20 sm:pt-24 md:pt-20 lg:pt-20 bg-background min-h-screen flex flex-col justify-center relative overflow-hidden">
      <CedarBackground />

      {/* Constrain button positioning on wide screens */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto relative h-20 pointer-events-none px-3 md:px-8 lg:px-12">
          <div className="absolute top-6 left-3 md:left-0 pointer-events-auto">
            {!isRootHub && <BackButton />}
          </div>
          <div className="absolute top-6 right-3 md:right-0 pointer-events-auto">
            <CollapsibleButtonMenu buttons={menuButtons} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4 md:mb-6 lg:mb-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center">
          <h1 className={`${fontClass} text-4xl md:text-5xl lg:text-6xl font-bold text-text`}>{headerText}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Center Person(s) Row - Always side by side */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          <div className="flex flex-row justify-center gap-4 sm:gap-6 md:gap-6 lg:gap-8">
            <div className="w-40 sm:w-44 md:w-44 lg:w-48">
              <PersonCard key={centerPerson.id} person={centerPerson} variant="hub" isRootLevel={true} showName={showNames} />
            </div>
            {spousePerson && (
              <div className="w-40 sm:w-44 md:w-44 lg:w-48">
                <PersonCard key={spousePerson.id} person={spousePerson} variant="hub" isRootLevel={true} showName={showNames} />
              </div>
            )}
            {/* Add Spouse Card - only show in edit mode when no spouse exists */}
            {isEditMode && !spousePerson && (
              <div className="w-40 sm:w-44 md:w-44 lg:w-48">
                <AddPersonCard
                  spouseId={centerPerson.id}
                  variant="spouse"
                />
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Tree Connector */}
        {(childrenList.length > 0 || isEditMode) && (
          <div className="relative mb-4 md:mb-6 lg:mb-8">
            {/* Vertical trunk from parents */}
            <div className="h-8 md:h-10 lg:h-12 w-0.5 md:w-1 bg-gradient-to-b from-accent/40 via-accent/30 to-accent/20 mx-auto"></div>

            {/* Horizontal branch line connecting to children */}
            {childrenList.length > 0 && (
              <div className="relative h-8 md:h-10">
                {/* Main horizontal line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 md:w-2/3 h-0.5 md:h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>

                {/* Vertical drops to each child */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 md:w-2/3 h-full flex justify-around">
                  {childrenList.map((child) => (
                    <div
                      key={child.id}
                      className="w-0.5 md:w-1 bg-gradient-to-b from-accent/30 to-accent/10"
                      style={{ opacity: 0.6 }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Children Row - Responsive grid */}
        {(childrenList.length > 0 || isEditMode) && (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-4 lg:gap-6">
            {childrenList.map((child) => (
              <div key={child.id} className="w-40 sm:w-44 md:w-44 lg:w-48">
                <PersonCard person={child} variant="thumbnail" showName={showNames} />
              </div>
            ))}
            {/* Add Person Card - only show in edit mode */}
            {isEditMode && (
              <div className="w-40 sm:w-44 md:w-44 lg:w-48">
                <AddPersonCard
                  parentIds={spousePerson ? [centerPerson.id, spousePerson.id] : [centerPerson.id]}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyHub;
