import { useState, useEffect, useRef } from 'react';
import { X, MoveDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ButtonConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  show?: boolean;
  ariaLabel?: string;
  hideOnMobile?: boolean;
  disabled?: boolean;
}

interface CollapsibleButtonMenuProps {
  buttons: ButtonConfig[];
  className?: string;
}

export function CollapsibleButtonMenu({ buttons, className = '' }: CollapsibleButtonMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter buttons based on show condition
  const visibleButtons = buttons.filter(btn => btn.show !== false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [isExpanded]);

  const handleButtonClick = (onClick: () => void) => {
    onClick();
    setIsExpanded(false);
  };

  return (
    <div ref={menuRef} className={`fixed top-0 safe-right z-50 ${className}`}>
      {/* Semi-circle toggle button - touches both edges of corner */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-0 right-0 w-12 h-12 md:w-14 md:h-14 bg-accent hover:bg-accent-warm transition-colors duration-300 cursor-pointer shadow-lg flex items-start justify-end"
        style={{
          borderBottomLeftRadius: '100%',
        }}
        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
        aria-expanded={isExpanded}
        whileTap={{ scale: 1.3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <div className="pt-1 pr-1 md:pt-1.5 md:pr-1.5">
          {isExpanded ? (
            <X className="w-5 h-5 md:w-6 md:h-6 text-accent-text" />
          ) : (
            <MoveDownLeft className="w-5 h-5 md:w-6 md:h-6 text-accent-text" />
          )}
        </div>
      </motion.button>

      {/* Expanded Buttons - slide down from the semi-circle with original styling */}
      <div
        className={`absolute top-14 right-2 md:top-16 md:right-3 flex flex-col items-end gap-3 transition-all duration-300 ease-in-out ${
          isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {visibleButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => !button.disabled && handleButtonClick(button.onClick)}
            disabled={button.disabled}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-card/80 backdrop-blur-md shadow-lg border border-border/50 flex items-center justify-center transition-all transform ${
              button.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-card hover:scale-105'
            } ${button.hideOnMobile ? 'hidden md:flex' : ''}`}
            aria-label={button.ariaLabel || button.label}
            title={button.label}
          >
            {button.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
