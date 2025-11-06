import { memo, useRef } from 'react';
import { Person } from '../types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { getPersonName } from '../utils/i18n';

interface PersonCardProps {
  person: Person;
  variant?: 'hub' | 'thumbnail';
  isRootLevel?: boolean;
  showName?: boolean;
  disableInitialAnimation?: boolean;
  onZoomClick?: (person: Person, rect: DOMRect, showName: boolean, imageSrc: string) => void;
  isHidden?: boolean; // Hide card during zoom transition
  disableNavigation?: boolean; // Disable navigation but keep visual feedback
  forceDetailPage?: boolean; // Force navigation to detail page instead of hub
}

// Smooth transition config - optimized for fluid motion
const smoothTransition = {
  type: 'tween' as const,
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number], // easeInOut
};

const PersonCard = ({
  person,
  variant = 'hub',
  isRootLevel = false,
  showName = true,
  disableInitialAnimation = false,
  onZoomClick,
  isHidden = false,
  disableNavigation = false,
  forceDetailPage = false,
}: PersonCardProps) => {
  const { language } = useLanguage();
  const { setNavigationDirection } = useNavigation();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasChildren = person.childrenIds && person.childrenIds.length > 0;
  const hasSpouse = !!person.spouseId;

  // Navigate to hub if person has spouse or children AND is not at root level
  // Otherwise go to person detail page
  // If forceDetailPage is true, always navigate to detail page
  const linkTo = forceDetailPage 
    ? `/person/${person.id}` 
    : ((hasSpouse || hasChildren) && !isRootLevel) ? `/hub/${person.id}` : `/person/${person.id}`;

  const fontClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  // Handle click - trigger zoom transition for hub routes
  const handleClick = (e: React.MouseEvent) => {
    // Set navigation direction to forward for all navigations
    setNavigationDirection('forward');

    const isHubRoute = linkTo.startsWith('/hub/');

    if (isHubRoute && !isRootLevel && onZoomClick && cardRef.current) {
      e.preventDefault();
      e.stopPropagation();

      // Get card bounds and image source
      const rect = cardRef.current.getBoundingClientRect();
      const imgElement = cardRef.current.querySelector('img');
      const imageSrc = imgElement?.src || person.primaryPhoto;

      // Trigger zoom transition
      onZoomClick(person, rect, showName, imageSrc);
    }
  };

  // Both hub and thumbnail variants with names: circular with name underneath
  if (showName) {
    const nameSize = variant === 'hub' ? 'text-xl md:text-2xl' : 'text-lg md:text-xl';

    const content = (
      <>
        <motion.div
          className="p-1 bg-background rounded-full shadow-xl"
          transition={smoothTransition}
        >
          <img
            src={person.primaryPhoto}
            alt={`Photo of ${getPersonName(person, language)}`}
            loading="lazy"
            className="profile-image aspect-square object-cover w-full rounded-full ring-2 ring-accent/30 bg-gray-100"
          />
        </motion.div>
        <motion.h2
          className={`${fontClass} font-light text-accent ${nameSize} text-center leading-tight`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...smoothTransition, delay: 0.1 }}
        >
          {getPersonName(person, language)}
        </motion.h2>
      </>
    );

    return (
      <motion.div
        ref={cardRef}
        data-person-id={person.id}
        {...(!disableInitialAnimation && {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: {
            opacity: { duration: 0.6 },
            scale: { duration: smoothTransition.duration },
          },
        })}
        className={`flex flex-col items-center gap-3 ${isHidden ? 'invisible pointer-events-none opacity-0' : ''}`}
        whileHover={isHidden ? {} : { scale: 1.02 }}
        whileTap={isHidden ? {} : (disableNavigation ? { scale: 1.1 } : { scale: 0.98 })}
      >
        {disableNavigation ? (
          <div className="flex flex-col items-center gap-3 w-full">
            {content}
          </div>
        ) : (
          <Link to={linkTo} onClick={handleClick} className="flex flex-col items-center gap-3 w-full">
            {content}
          </Link>
        )}
      </motion.div>
    );
  }

  // Hidden names: circular only
  const imageContent = (
    <motion.div
      className="p-1 bg-background rounded-full shadow-xl"
      transition={smoothTransition}
    >
      <img
        src={person.primaryPhoto}
        alt={`Photo of ${getPersonName(person, language)}`}
        loading="lazy"
        className="aspect-square object-cover w-full rounded-full ring-2 ring-accent/30 bg-gray-100"
      />
    </motion.div>
  );

  return (
    <motion.div
      ref={cardRef}
      data-person-id={person.id}
      {...(disableInitialAnimation
        ? { initial: false } // Inherit from parent wrapper
        : {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            transition: {
              opacity: { duration: 0.6 },
              scale: { duration: smoothTransition.duration },
            },
          }
      )}
      className={`block ${isHidden ? 'invisible pointer-events-none opacity-0' : ''}`}
      whileHover={isHidden ? {} : { scale: 1.05 }}
      whileTap={isHidden ? {} : (disableNavigation ? { scale: 1.1 } : { scale: 0.98 })}
    >
      {disableNavigation ? (
        <div className="block">
          {imageContent}
        </div>
      ) : (
        <Link to={linkTo} onClick={handleClick} className="block">
          {imageContent}
        </Link>
      )}
    </motion.div>
  );
};

// Custom comparison function for memo
// Only re-render if person data, variant, isRootLevel, showName, or isHidden actually changes
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
    prevProps.showName === nextProps.showName &&
    prevProps.isHidden === nextProps.isHidden &&
    prevProps.forceDetailPage === nextProps.forceDetailPage
  );
};

export default memo(PersonCard, areEqual);
