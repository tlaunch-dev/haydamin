import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PersonCard from '../components/PersonCard';
import AddPersonCard from '../components/AddPersonCard';
import BackButton from '../components/BackButton';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { usePeople } from '../hooks/usePeople';
import { Person } from '../types';
import { getPersonName, t } from '../utils/i18n';

const FamilyHub = () => {
  const { personId } = useParams<{ personId: string }>();
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

  return (
    <div className="p-6 md:p-12 bg-background min-h-screen">
      <LanguageToggle />
      
      {/* Edit mode toggle button - to the left of eye button */}
      <button
        onClick={() => setIsEditMode(!isEditMode)}
        className={`fixed top-6 right-30 z-40 font-bold w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-110 flex items-center justify-center ${
          isEditMode ? 'bg-accent text-accent-text' : 'bg-card text-accent'
        }`}
        aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </button>
      
      {/* Eye toggle button - to the left of language button */}
      <button
        onClick={() => setShowNames(!showNames)}
        className="fixed top-6 right-18 z-40 bg-card text-accent font-bold w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-110 flex items-center justify-center"
        aria-label={showNames ? 'Hide names' : 'Show names'}
      >
        {showNames ? (
          // Eye open icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) : (
          // Eye closed icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        )}
      </button>

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
            <PersonCard person={centerPerson} variant="hub" isRootLevel={true} showName={showNames} />
            {spousePerson && <PersonCard person={spousePerson} variant="hub" isRootLevel={true} showName={showNames} />}
            {/* Add Spouse Card - only show in edit mode when no spouse exists */}
            {isEditMode && !spousePerson && (
              <AddPersonCard 
                spouseId={centerPerson.id}
                variant="spouse"
              />
            )}
          </div>
        </div>

        {/* Tree Connector */}
        {(childrenList.length > 0 || isEditMode) && (
          <div className="h-12 w-1 bg-accent opacity-30 mx-auto mb-6"></div>
        )}

        {/* Children Row - Single Line */}
        {(childrenList.length > 0 || isEditMode) && (
          <div className="overflow-x-auto">
            <div className="flex justify-center gap-3 md:gap-4 min-w-min px-4">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyHub;
