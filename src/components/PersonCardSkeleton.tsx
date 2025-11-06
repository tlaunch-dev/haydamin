/**
 * PersonCardSkeleton - Loading placeholder for PersonCard
 * Shows animated skeleton while person data is loading
 */

interface PersonCardSkeletonProps {
  variant?: 'hub' | 'thumbnail';
  showName?: boolean;
}

export default function PersonCardSkeleton({
  variant = 'hub',
  showName = true,
}: PersonCardSkeletonProps) {
  const imageSize = variant === 'hub' ? 'w-32 h-32 md:w-40 md:h-40' : 'w-28 h-28 md:w-32 md:h-32';

  return (
    <div className="flex flex-col items-center gap-3 animate-pulse">
      {/* Profile Image Skeleton */}
      <div className="p-1 bg-background rounded-full shadow-xl">
        <div className={`${imageSize} rounded-full bg-accent/20`} />
      </div>

      {/* Name Skeleton */}
      {showName && (
        <div className="space-y-2 w-full">
          <div className="h-6 bg-accent/20 rounded w-24 mx-auto" />
        </div>
      )}
    </div>
  );
}

