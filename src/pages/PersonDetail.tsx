import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPersonById, getSpouse, getChildren } from '../data/mockFamily';
import BackButton from '../components/BackButton';
import FamilyLinkCard from '../components/FamilyLinkCard';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';
import { getPersonName, getRelationship, getLocation, getFavoriteFood, t } from '../utils/i18n';
import { Person } from '../types';

// Utility function from mock
const calculateAge = (birthdayString: string | undefined) => {
  if (!birthdayString) return null;
  const birthday = new Date(birthdayString);
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export function PersonDetail() {
  const { personId } = useParams<{ personId: string }>();
  const { language } = useLanguage();
  const [person, setPerson] = useState<Person | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (personId) {
      const foundPerson = getPersonById(personId);
      setPerson(foundPerson || null);
      setIsRevealed(false); // Reset reveal state on person change
    }
  }, [personId]);
  
  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <h1 className="text-2xl font-sans text-text">{t('person_not_found', language)}</h1>
      </div>
    );
  }

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  const spouse = getSpouse(person.id);
  const children = getChildren(person.id);
  const familyMembers = [spouse, ...children].filter(Boolean) as Person[];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <>
      <div className="p-6 md:p-12 bg-background min-h-screen">
        <LanguageToggle />
        {/* Header with Back Button and Title/Button */}
        <div className="mb-8 max-w-7xl mx-auto">
          <div className="relative flex items-center">
            <div className="absolute left-0">
              <BackButton />
            </div>
            
            <div className="flex-1 flex justify-center">
              {!isRevealed && (
                <button
                  onClick={handleReveal}
                  className={`${fontClass} text-3xl md:text-4xl font-bold py-6 px-12 rounded-2xl shadow-lg transition-all duration-300 ease-out hover:shadow-xl hover:scale-105 bg-accent text-accent-text animate-fade-in`}
                >
                  {t('whos_this', language)}
                </button>
              )}
              {isRevealed && (
                <div className="text-center animate-reveal-name">
                  <h2 className={`${fontClass} text-5xl md:text-6xl font-bold text-text`}>
                    {getPersonName(person, language)}
                  </h2>
                  <p className={`${fontClass} text-2xl md:text-3xl mt-2 text-accent`}>
                    {getRelationship(person, language)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          {!isRevealed ? (
            /* Initial State: Centered Photo */
            <div className="flex flex-col items-center gap-8 mt-12 animate-fade-in">
              <img
                src={person.primaryPhoto}
                alt={`Photo`}
                className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover shadow-xl transition-all duration-500 ease-out"
              />
            </div>
          ) : (
            /* Revealed State: Full Layout */
            <>

              {/* Profile + About Card */}
              <div className="bg-card rounded-3xl p-4 md:p-8 shadow-sm mt-4 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <div className={`flex flex-col md:flex-row items-center md:items-start gap-8 ${language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
                  <div className="flex-1 w-full">
                    <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-lg md:text-xl text-text">
                      {person.birthday && (
                        <>
                          <span className={`${fontClass} font-semibold`}>{t('birthday', language)}</span>
                          <span className={fontClass}>{new Date(person.birthday).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </>
                      )}
                      
                      {person.birthday && (
                        <>
                          <span className={`${fontClass} font-semibold`}>{t('age', language)}</span>
                          <span className={fontClass}>{calculateAge(person.birthday)}</span>
                        </>
                      )}
                      
                      <span className={`${fontClass} font-semibold`}>{t('lives_in', language)}</span>
                      <span className={fontClass}>{getLocation(person, language)}</span>
                      
                      <span className={`${fontClass} font-semibold`}>{t('loves', language)}</span>
                      <span className={fontClass}>{getFavoriteFood(person, language)}</span>
                    </div>
                  </div>

                  <img
                    src={person.primaryPhoto}
                    alt={`Main photo of ${getPersonName(person, language)}`}
                    className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover shadow-lg cursor-pointer transition-transform duration-300 ease-out hover:scale-105 hover:shadow-xl shrink-0"
                    onClick={openModal}
                  />
                </div>
              </div>
            </>
          )}

          {/* Family Card - Only show after reveal */}
          {isRevealed && familyMembers.length > 0 && (
            <div className="bg-card rounded-3xl p-8 shadow-sm animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <h3 className={`${fontClass} text-3xl font-bold mb-6 text-text`}>{t('family_section', language)}</h3>
              <div className="flex gap-6 pb-4 flex-wrap">
                {familyMembers.map((member) => (
                  <FamilyLinkCard key={member.id} person={member} showRelationship={member.id === spouse?.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-text bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <span className="absolute top-4 right-8 text-white text-6xl font-bold cursor-pointer" onClick={closeModal}>&times;</span>
          <div className="relative p-5 w-11/12 max-w-4xl" onClick={e => e.stopPropagation()}>
            <img 
              src={person.primaryPhoto} // In a real app, this would be the selected gallery photo
              alt={`Full size of ${getPersonName(person, language)}`} 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl mx-auto" 
            />
          </div>
        </div>
      )}
    </>
  );
}
