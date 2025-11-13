import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PersonCard from '../components/PersonCard';
import AddPersonCard from '../components/AddPersonCard';
import BackButton from '../components/BackButton';
import AnimatedTreeConnector from '../components/AnimatedTreeConnector';
import LoadingScreen from '../components/LoadingScreen';
import SwipeBackIndicator from '../components/SwipeBackIndicator';
import { CollapsibleButtonMenu, ButtonConfig } from '../components/CollapsibleButtonMenu';
import { useLanguage } from '../context/LanguageContext';
import { useHiddenMode } from '../context/HiddenModeContext';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { usePeople } from '../hooks/usePeople';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { usePersonImagePreload } from '../hooks/useImagePreload';
import { Person } from '../types';
import { getPersonName, t } from '../utils/i18n';
import { getNavigationDirectionFromLocation, getBackNavigationPending, clearBackNavigationPending } from '../utils/navigationState';
import { Pencil, Dices, Images, Vault } from 'lucide-react';

// Type alias for easing functions
type Easing = [number, number, number, number];

const FamilyHub = () => {
  const { personId: routePersonId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const { showNames } = useHiddenMode();
  const { initialLoadComplete } = useAuth();
  const { people, loading, error } = usePeople();
  const [isEditMode, setIsEditMode] = useState(false);
  const [treeWidth, setTreeWidth] = useState(800);

  // Tree animation timing constants (match AnimatedTreeConnector.tsx)
  // 30% faster than original timing
  const TREE_WRAPPER_DELAY = 0.14;
  const TREE_WRAPPER_FADE = 0.21;
  const TREE_DROP_DELAY = 0.7;

  // Calculate responsive tree width
  useEffect(() => {
    const updateTreeWidth = () => {
      const width = Math.min(800, window.innerWidth - 60);
      setTreeWidth(width);
    };

    updateTreeWidth();
    window.addEventListener('resize', updateTreeWidth);
    return () => window.removeEventListener('resize', updateTreeWidth);
  }, []);

  // Navigation direction: check location state first (for forward nav with state),
  // then module-level back navigation flag (for back nav), then context (for reactivity)
  // Store in state to survive multiple renders
  const { navigationDirection: contextDirection } = useNavigation();
  const locationStateDirection = getNavigationDirectionFromLocation(location.state);
  const [navigationDirection] = useState<'forward' | 'back' | null>(() => {
    // Only check the flag on initial mount
    const isBackNav = getBackNavigationPending();
    return locationStateDirection || (isBackNav ? 'back' : null) || contextDirection;
  });

  // Clear the back navigation flag when route changes
  useEffect(() => {
    clearBackNavigationPending();
  }, [routePersonId]);

  const [showChildren, setShowChildren] = useState(false);
  const animationStartedRef = useRef(false);

  // Swipe-back gesture - only enable on non-root pages
  const { swipeProgress, isSwipping } = useSwipeBack({
    enabled: !!routePersonId,
  });

  // Control when children should start animating
  // Reset on route change, then trigger during tree animation
  useEffect(() => {
    // Reset animation state for new route
    animationStartedRef.current = false;
    setShowChildren(false);
  }, [routePersonId]);

  // Separate effect to start animation when ready
  useEffect(() => {
    // On back navigation, show children immediately without animation
    if (navigationDirection === 'back') {
      setShowChildren(true);
      animationStartedRef.current = true;
      return;
    }

    // Don't start if already started
    if (animationStartedRef.current) {
      return;
    }


    // Mark as started
    animationStartedRef.current = true;

    // Start children when tree drops are about 3/4 of the way started
    const CHILDREN_START_DELAY = TREE_WRAPPER_DELAY + TREE_WRAPPER_FADE + (TREE_DROP_DELAY * .9);

    // Start children animation while tree is still drawing
    const timer = setTimeout(() => {
      setShowChildren(true);
    }, CHILDREN_START_DELAY * 1000); // Convert to milliseconds

    return () => clearTimeout(timer);
  }, [routePersonId, navigationDirection, TREE_WRAPPER_DELAY, TREE_WRAPPER_FADE, TREE_DROP_DELAY]);

  // Scroll to top on route change (especially important for iOS)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [routePersonId]);


  // Get root person IDs from environment
  const ROOT_PERSON_1 = import.meta.env.VITE_ROOT_PERSON_ID_1 || 'teta-1';
  const ROOT_PERSON_2 = import.meta.env.VITE_ROOT_PERSON_ID_2 || 'jiddo-1';

  // Use routePersonId as the active person
  const personId = routePersonId;

  // Helper functions to query people array (memoized)
  const getPersonById = useCallback((id: string): Person | undefined => {
    return people.find(p => p.id === id);
  }, [people]);

  const getSpouse = useCallback((id: string): Person | undefined => {
    const person = getPersonById(id);
    if (!person?.spouseId) return undefined;
    return getPersonById(person.spouseId);
  }, [getPersonById]);

  const getChildren = useCallback((id: string): Person[] => {
    const person = getPersonById(id);
    if (!person?.childrenIds) return [];
    return person.childrenIds.map(childId => getPersonById(childId)).filter(Boolean) as Person[];
  }, [getPersonById]);

  // Determine who to display based on route (do this before early returns)
  const isRootHub = !personId;

  // Memoize family data calculations
  const { centerPerson, spousePerson, childrenList } = useMemo(() => {
    let center, spouse, children;

    if (isRootHub) {
      // Root hub: show both root people at top
      center = getPersonById(ROOT_PERSON_1);
      spouse = getPersonById(ROOT_PERSON_2);
      children = center ? getChildren(center.id) : [];
    } else {
      // Individual hub: show person, their spouse, and their children
      center = getPersonById(personId);
      spouse = center ? getSpouse(personId) : undefined;
      children = center ? getChildren(center.id) : [];
    }

    return { centerPerson: center, spousePerson: spouse, childrenList: children };
  }, [isRootHub, personId, getPersonById, getSpouse, getChildren, ROOT_PERSON_1, ROOT_PERSON_2]);

  // Preload images for visible family members
  const peopleToPreload = useMemo(() => {
    const allVisible = [];
    if (centerPerson) allVisible.push(centerPerson);
    if (spousePerson) allVisible.push(spousePerson);
    if (childrenList) allVisible.push(...childrenList);
    return allVisible;
  }, [centerPerson, spousePerson, childrenList]);

  usePersonImagePreload(peopleToPreload);

  // Check if gallery mode should be available (memoized)
  // Must be before early returns to follow Rules of Hooks
  const hasAdditionalPhotos = useMemo(() =>
    people.some(person => person.photos && person.photos.length > 0),
    [people]
  );

  // Handle game mode button click - useCallback to keep stable reference
  const handleGameMode = useCallback(() => {
    if (people.length === 0) return;
    localStorage.removeItem('haydamin_game_mode_shown_ids');
    const randomPerson = people[Math.floor(Math.random() * people.length)];
    navigate(`/person/${randomPerson.id}?game=true`);
  }, [people, navigate]);

  // Handle gallery mode button click - useCallback to keep stable reference
  const handleGalleryMode = useCallback(() => {
    if (!hasAdditionalPhotos) return;
    navigate('/gallery');
  }, [hasAdditionalPhotos, navigate]);

  // Handle memories button click - useCallback to keep stable reference
  const handleMemories = useCallback(() => {
    navigate('/memories');
  }, [navigate]);

  // Handle edit mode toggle - useCallback to keep stable reference
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  // Configure menu buttons - memoized to prevent re-renders during navigation
  // MUST be before early returns to follow Rules of Hooks
  const menuButtons: ButtonConfig[] = useMemo(() => [
    {
      id: 'game-mode',
      icon: <Dices className="w-5 h-5 text-accent" />,
      label: language === 'ar' ? 'هيدا مين؟' : 'Hayda Min?',
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
      id: 'memories',
      icon: <Vault className="w-5 h-5 text-accent" />,
      label: language === 'ar' ? 'الذكريات' : 'Memories',
      onClick: handleMemories,
      beta: true, // Beta feature - only shown after long press
    },
    {
      id: 'edit-mode',
      icon: <Pencil className="w-5 h-5 text-accent" />,
      label: isEditMode ? 'Exit edit mode' : 'Edit',
      onClick: handleToggleEditMode,
    },
    {
      id: 'language',
      icon: <span className="text-accent font-bold text-lg">{language === 'ar' ? 'EN' : 'ع'}</span>,
      label: language === 'ar' ? 'English' : 'العربية',
      onClick: toggleLanguage,
    },
  ], [language, people.length, hasAdditionalPhotos, isEditMode, handleGameMode, handleGalleryMode, handleMemories, handleToggleEditMode, toggleLanguage]);

  // Show loading state - only show full animation if initial load is not complete
  if (loading) {
    // If we've already done the initial load, show empty background while loading data
    // This prevents the loading screen from reappearing when navigating between pages
    if (initialLoadComplete) {
      return <div className="min-h-screen bg-background" />;
    }
    return <LoadingScreen />;
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

  // Show person not found state
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

  // Spouse fades in with tree animation
  const spouseVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as Easing,
        delay: TREE_WRAPPER_DELAY + TREE_WRAPPER_FADE + (TREE_DROP_DELAY * 0.5), // Fade in mid tree drop
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
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

  return (
    <>
      {/* Swipe-back gesture indicator */}
      <SwipeBackIndicator isSwipping={isSwipping} progress={swipeProgress} />

      <AnimatePresence initial={false}>
        <motion.div
          key={personId || 'root'}
        className="p-3 sm:p-4 md:p-6 lg:p-8 pt-20 sm:pt-24 md:pt-20 min-h-screen flex flex-col relative overflow-hidden"
        initial={{
          opacity: navigationDirection === 'back' ? 1 : 0,
          x: navigationDirection === 'back' ? '-100%' : 0
        }}
        animate={{
          opacity: 1,
          x: 0
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1] as Easing,
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1] as Easing,
          }
        }}
      >

      {/* Back Button */}
      {!isRootHub && (
        <div className="fixed safe-top safe-left z-50 ios-fixed-optimized">
          <BackButton />
        </div>
      )}

      {/* Header */}
      <div className="mb-4 md:mb-6 lg:mb-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center">
          <h1 className={`${fontClass} text-4xl md:text-5xl lg:text-6xl font-bold text-text`}>{headerText}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Center Person(s) Row - Fade in first */}
        <motion.div
          className="mb-4 md:mb-6 lg:mb-8"
          variants={navigationDirection === 'back' ? undefined : parentContainerVariants}
          initial={navigationDirection === 'back' ? false : "hidden"}
          animate={navigationDirection === 'back' ? false : "visible"}
        >
          <div className="flex flex-row justify-center gap-4 sm:gap-6 md:gap-7 lg:gap-8">
            <motion.div
              key={centerPerson.id}
              className="w-40 sm:w-44 md:w-46 lg:w-48"
              variants={navigationDirection === 'back' ? undefined : parentItemVariants}
              initial={navigationDirection === 'back' ? false : undefined}
              animate={navigationDirection === 'back' ? false : undefined}
            >
              <PersonCard
                person={centerPerson}
                variant="hub"
                isRootLevel={true}
                showName={showNames}
                disableInitialAnimation={true}
              />
            </motion.div>
            <AnimatePresence>
              {spousePerson && (
                <motion.div
                  key={spousePerson.id}
                  className="w-40 sm:w-44 md:w-46 lg:w-48"
                  variants={navigationDirection === 'back' ? undefined : (isRootHub ? parentItemVariants : spouseVariants)}
                  initial={navigationDirection === 'back' ? false : "hidden"}
                  animate={navigationDirection === 'back' ? false : "visible"}
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
                containerWidth={treeWidth}
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
              variants={navigationDirection === 'back' ? undefined : childrenContainerVariants}
              initial={navigationDirection === 'back' ? false : "hidden"}
              animate={navigationDirection === 'back' ? false : (showChildren ? "visible" : "hidden")}
            >
              {childrenList.map((child, index) => (
                <motion.div
                  key={child.id}
                  className="w-40 sm:w-44 md:w-46 lg:w-48"
                  variants={navigationDirection === 'back' ? undefined : getChildItemVariants(index)}
                  initial={navigationDirection === 'back' ? false : undefined}
                  animate={navigationDirection === 'back' ? false : undefined}
                >
                  <PersonCard
                    person={child}
                    variant="thumbnail"
                    showName={showNames}
                    disableInitialAnimation={true}
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

      {/* Corner Menu - outside animated container to stay fixed */}
      <CollapsibleButtonMenu buttons={menuButtons} />
    </>
  );
};

export default FamilyHub;
