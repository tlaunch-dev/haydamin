import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PersonCard from '../components/PersonCard';
import AddPersonCard from '../components/AddPersonCard';
import BackButton from '../components/BackButton';
import CedarBackground from '../components/CedarBackground';
import AnimatedTreeConnector from '../components/AnimatedTreeConnector';
import { ZoomTransitionOverlay } from '../components/ZoomTransitionOverlay';
import { CollapsibleButtonMenu, ButtonConfig } from '../components/CollapsibleButtonMenu';
import { useLanguage } from '../context/LanguageContext';
import { useHiddenMode } from '../context/HiddenModeContext';
import { usePeople } from '../hooks/usePeople';
import { Person } from '../types';
import { getPersonName, t } from '../utils/i18n';
import { Eye, EyeOff, Pencil, Dices, Images } from 'lucide-react';

// Type alias for easing functions
type Easing = [number, number, number, number];

const FamilyHub = () => {
  const { personId: routePersonId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { showNames, toggleShowNames } = useHiddenMode();
  const { people, loading, error } = usePeople();
  const [isEditMode, setIsEditMode] = useState(false);

  // Tree animation timing constants (match AnimatedTreeConnector.tsx)
  // 30% faster than original timing
  const TREE_WRAPPER_DELAY = 0.14;
  const TREE_WRAPPER_FADE = 0.21;
  const TREE_DROP_DELAY = 0.7;

  // Zoom transition state
  const [zoomTransition, setZoomTransition] = useState<{
    person: Person;
    startRect: DOMRect;
    showName: boolean;
    imageSrc: string;
    targetPersonId: string;
  } | null>(null);
  const [zoomPhase, setZoomPhase] = useState<'zoom-in' | 'zoom-out' | 'reveal-card' | 'complete' | null>(null);
  const [hiddenPersonId, setHiddenPersonId] = useState<string | null>(null);
  const [showChildren, setShowChildren] = useState(false);

  // Control when children should start animating
  // Reset on route change, then trigger during tree animation
  useEffect(() => {
    // Reset children visibility when route changes
    setShowChildren(false);

    // Start children when tree drops are about 3/4 of the way started
    const CHILDREN_START_DELAY = TREE_WRAPPER_DELAY + TREE_WRAPPER_FADE + (TREE_DROP_DELAY * .9);

    // Start children animation while tree is still drawing
    const timer = setTimeout(() => {
      setShowChildren(true);
    }, CHILDREN_START_DELAY * 1000); // Convert to milliseconds

    return () => clearTimeout(timer);
  }, [routePersonId]);

  // Handle zoom transition click
  const handleZoomClick = useCallback((person: Person, rect: DOMRect, showName: boolean, imageSrc: string) => {
    // Hide the clicked card on current page
    setHiddenPersonId(person.id);

    // Start zoom transition
    setZoomTransition({
      person,
      startRect: rect,
      showName,
      imageSrc,
      targetPersonId: person.id,
    });

    // Navigate using React Router (content changes underneath animation)
    navigate(`/hub/${person.id}`, { replace: false });
  }, [navigate]);

  // Handle zoom animation phase changes
  const handleZoomPhaseChange = useCallback((phase: 'zoom-in' | 'zoom-out' | 'reveal-card' | 'complete') => {
    setZoomPhase(phase);

    if (phase === 'reveal-card') {
      // Show the card underneath before overlay fades
      setHiddenPersonId(null);
    } else if (phase === 'complete') {
      // Clean up transition state
      setZoomTransition(null);
      setZoomPhase(null);
    }
  }, []);

  // Get root person IDs from environment
  const ROOT_PERSON_1 = import.meta.env.VITE_ROOT_PERSON_ID_1 || 'teta-1';
  const ROOT_PERSON_2 = import.meta.env.VITE_ROOT_PERSON_ID_2 || 'jiddo-1';

  // Use routePersonId as the active person
  const personId = routePersonId;
  
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
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-sans text-text"
        >
          Loading...
        </motion.h1>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-sans text-text"
        >
          Error loading family data
        </motion.h1>
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
    localStorage.removeItem('haydamin_game_mode_shown_ids');
    const randomPerson = people[Math.floor(Math.random() * people.length)];
    navigate(`/person/${randomPerson.id}?game=true`);
  };

  // Check if gallery mode should be available
  const hasAdditionalPhotos = people.some(person => person.photos && person.photos.length > 0);

  // Handle gallery mode button click
  const handleGalleryMode = () => {
    if (!hasAdditionalPhotos) return;
    navigate('/gallery');
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
      id: 'gallery-mode',
      icon: <Images className="w-5 h-5 text-accent" />,
      label: t('gallery_mode', language),
      onClick: handleGalleryMode,
      show: hasAdditionalPhotos,
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
      onClick: toggleShowNames,
    },
    {
      id: 'language',
      icon: <span className="text-accent font-bold text-lg">{language === 'ar' ? 'EN' : 'ع'}</span>,
      label: language === 'ar' ? 'English' : 'العربية',
      onClick: toggleLanguage,
    },
  ];

  // Animation variants - parents load instantly
  const parentContainerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0,
      },
    },
  };

  const parentItemVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as Easing,
      },
    },
  };

  // Children fade in and bounce when tree connector reaches them
  // Note: Timing controlled via showChildren state in useEffect
  const childrenContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.084, // Stagger from left to right (30% faster)
        delayChildren: 0, // No delay needed - timing controlled by state
      },
    },
  };

  // Create variant function that varies per child
  const getChildItemVariants = (index: number) => {
    // Vary the drop height slightly for more organic feel
    const startHeight = -150 + (index % 3) * 10; // Vary by 0-20px
    // Vary the bounce overshoot slightly
    const overshoot = 18 + (index % 2) * 4; // 18 or 22
    const bounce1 = -10 - (index % 2) * 2; // -10 or -12
    const bounce2 = 5 + (index % 3); // 5, 6, or 7
    const bounce3 = -2 - (index % 2); // -2 or -3

    // Vary duration slightly for different drop speeds (30% faster)
    const duration = 0.91 + (index % 4) * 0.105; // 0.91 to 1.225 seconds

    return {
      hidden: {
        opacity: 0,
        scale: 0.3,
        y: startHeight,
      },
      visible: {
        opacity: 1,
        scale: 1,
        // Keyframe bounce: drop from high position, overshoot down, bounce up, settle
        y: [startHeight, overshoot, bounce1, bounce2, bounce3, 0],
        transition: {
          opacity: { duration: 0.14 },
          scale: {
            duration: duration * 0.85,
            ease: [0.34, 1.56, 0.64, 1] as Easing, // Bouncy easing for scale
          },
          y: {
            duration: duration,
            times: [0, 0.5, 0.68, 0.8, 0.9, 1], // Timing for bounce sequence
            ease: "easeOut" as const,
          },
        },
      },
      exit: {
        opacity: 0,
        scale: 0.8,
        y: 20,
        transition: {
          duration: 0.21, // 30% faster
          ease: [0.4, 0, 0.2, 1] as Easing,
        },
      },
    };
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as Easing,
        delay: 0.1,
      },
    },
  };

  return (
    <>
      {/* Zoom Transition Overlay */}
      {zoomTransition && (
        <ZoomTransitionOverlay
          person={zoomTransition.person}
          startRect={zoomTransition.startRect}
          targetPersonId={zoomTransition.targetPersonId}
          showName={zoomTransition.showName}
          imageSrc={zoomTransition.imageSrc}
          onPhaseChange={handleZoomPhaseChange}
        />
      )}

      <AnimatePresence>
        <motion.div
          key={personId || 'root'}
          className="p-3 sm:p-4 md:p-6 lg:p-8 pt-20 sm:pt-24 md:pt-20 bg-background min-h-screen flex flex-col justify-center relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{
            opacity: zoomPhase === 'zoom-in' ? 0 : 1,
            transition: {
              duration: zoomPhase === 'zoom-out' ? 0.8 : 0.4,
              ease: [0.4, 0, 0.2, 1] as Easing,
            }
          }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1] as Easing,
            }
          }}
        >
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
      <motion.div
        className="mb-4 md:mb-6 lg:mb-8 max-w-7xl mx-auto w-full relative z-10"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <h1 className={`${fontClass} text-4xl md:text-5xl lg:text-6xl font-bold text-text`}>{headerText}</h1>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Center Person(s) Row - Fade in first */}
        <motion.div
          className="mb-4 md:mb-6 lg:mb-8"
          variants={parentContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-row justify-center gap-4 sm:gap-6 md:gap-7 lg:gap-8">
            <motion.div
              key={centerPerson.id}
              className="w-40 sm:w-44 md:w-46 lg:w-48"
              variants={parentItemVariants}
            >
              <PersonCard
                person={centerPerson}
                variant="hub"
                isRootLevel={true}
                showName={showNames}
                disableInitialAnimation={true}
                isHidden={hiddenPersonId === centerPerson.id}
              />
            </motion.div>
            <AnimatePresence>
              {spousePerson && (
                <motion.div
                  key={spousePerson.id}
                  className="w-40 sm:w-44 md:w-46 lg:w-48"
                  variants={parentItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <PersonCard
                    person={spousePerson}
                    variant="hub"
                    isRootLevel={true}
                    showName={showNames}
                    disableInitialAnimation={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Add Spouse Card - only show in edit mode when no spouse exists */}
            {isEditMode && !spousePerson && (
              <div className="w-40 sm:w-44 md:w-46 lg:w-48">
                <AddPersonCard
                  spouseId={centerPerson.id}
                  variant="spouse"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Animated Tree Connector - Starts drawing after parents load */}
        <AnimatePresence mode="wait">
          {(childrenList.length > 0 || isEditMode) && (
            <motion.div
              key={`tree-connector-${personId || 'root'}`}
              className="relative mb-4 md:mb-6 lg:mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                delay: TREE_WRAPPER_DELAY,
                duration: TREE_WRAPPER_FADE,
                ease: [0.4, 0, 0.2, 1] as Easing,
              }}
            >
              <AnimatedTreeConnector
                parentCount={spousePerson ? 2 : 1}
                childCount={childrenList.length}
                containerWidth={800}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Children Row - Grow from tree connectors */}
        <AnimatePresence>
          {(childrenList.length > 0 || isEditMode) && (
            <motion.div
              key="children-container"
              className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-6"
              variants={childrenContainerVariants}
              initial="hidden"
              animate={showChildren ? "visible" : "hidden"}
            >
              {childrenList.map((child, index) => (
                <motion.div
                  key={child.id}
                  className="w-40 sm:w-44 md:w-46 lg:w-48"
                  variants={getChildItemVariants(index)}
                >
                  <PersonCard
                    person={child}
                    variant="thumbnail"
                    showName={showNames}
                    disableInitialAnimation={true}
                    onZoomClick={handleZoomClick}
                    isHidden={hiddenPersonId === child.id}
                  />
                </motion.div>
              ))}
              {/* Add Person Card - only show in edit mode */}
              {isEditMode && (
                <div className="w-40 sm:w-44 md:w-46 lg:w-48">
                  <AddPersonCard
                    parentIds={spousePerson ? [centerPerson.id, spousePerson.id] : [centerPerson.id]}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>
    </AnimatePresence>
    </>
  );
};

export default FamilyHub;
