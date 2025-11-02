import { useNavigate } from 'react-router-dom';

interface AddPersonCardProps {
  parentIds?: string[];
  spouseId?: string;
  variant?: 'child' | 'spouse';
}

export default function AddPersonCard({ parentIds, spouseId, variant = 'child' }: AddPersonCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to add person with relationship info in state
    if (variant === 'spouse' && spouseId) {
      navigate('/add-person', { state: { spouseId } });
    } else if (parentIds) {
      navigate('/add-person', { state: { parentIds } });
    }
  };

  const sizeClasses = variant === 'spouse' 
    ? 'w-40 h-40 md:w-48 md:h-48' // Hub size for spouse
    : 'w-32 h-32 md:w-36 md:h-36'; // Thumbnail size for children

  return (
    <button
      onClick={handleClick}
      className="shrink-0 flex flex-col items-center gap-2 transition-all duration-300 ease-out hover:scale-105 cursor-pointer group"
    >
      <div className={`${sizeClasses} rounded-full bg-accent/10 border-4 border-dashed border-accent flex items-center justify-center group-hover:bg-accent/20 group-hover:border-accent/80 transition-all shadow-md group-hover:shadow-lg`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2.5} 
          stroke="currentColor" 
          className="w-12 h-12 text-accent group-hover:scale-110 transition-transform"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
    </button>
  );
}

