import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

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
    <div ref={menuRef} className={`fixed top-0 right-0 z-50 ${className}`}>
      {/* Semi-circle toggle button - touches both edges of corner */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-0 right-0 w-24 h-24 md:w-28 md:h-28 bg-accent hover:bg-accent-warm transition-all duration-300 cursor-pointer shadow-lg"
        style={{
          borderBottomLeftRadius: '100%',
        }}
        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
        aria-expanded={isExpanded}
      >
        {isExpanded && (
          <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3">
            <X className="w-6 h-6 md:w-7 md:h-7 text-accent-text" />
          </div>
        )}
      </button>

      {/* Expanded Buttons - slide down from the semi-circle with original styling */}
      <div
        className={`absolute top-20 right-3 md:top-24 md:right-4 flex flex-col items-end gap-3 transition-all duration-300 ease-in-out ${
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
