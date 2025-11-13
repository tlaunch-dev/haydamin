
interface MemoryCardContentProps {
  title: string;
  caption: string | undefined;
  dateStr: string;
}

/**
 * Content section of memory card (title, caption, date)
 */
export function MemoryCardContent({
  title,
  caption,
  dateStr,
}: MemoryCardContentProps) {
  return (
    <div>
      <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-text mb-0.5 md:mb-1">
        {title}
      </h3>
      {caption && (
        <p className="text-sm md:text-base lg:text-lg font-light text-text/70 mb-1">
          {caption}
        </p>
      )}

      {/* Metadata */}
      <div className="text-xs md:text-sm lg:text-base font-light text-accent text-right">
        <span>{dateStr}</span>
      </div>
    </div>
  );
}

