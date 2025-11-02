import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';

export interface ButtonConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  show?: boolean;
  ariaLabel?: string;
  hideOnMobile?: boolean;
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
    <div ref={menuRef} className={`fixed top-6 right-6 z-50 ${className}`}>
      <div className="flex flex-col items-end gap-2">
        {/* Menu Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-md shadow-lg border border-border/50 flex items-center justify-center hover:bg-card transition-all"
          aria-label={isExpanded ? 'Close menu' : 'Open menu'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-foreground" />
          )}
        </button>

        {/* Expanded Buttons */}
        <div
          className={`flex flex-col items-end gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {visibleButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => handleButtonClick(button.onClick)}
              className={`w-12 h-12 rounded-full bg-card/80 backdrop-blur-md shadow-lg border border-border/50 flex items-center justify-center hover:bg-card transition-all transform hover:scale-105 ${button.hideOnMobile ? 'hidden md:flex' : ''}`}
              aria-label={button.ariaLabel || button.label}
              title={button.label}
            >
              {button.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
