import { useMemories } from '../hooks/useMemories';
import { usePeople } from '../hooks/usePeople';
import { useLanguage } from '../context/LanguageContext';
import BackButton from '../components/BackButton';
import LoadingScreen from '../components/LoadingScreen';

export function MemoriesPage() {
  const { memories, loading: memoriesLoading } = useMemories();
  const { people, loading: peopleLoading } = usePeople();
  const { language } = useLanguage();

  const loading = memoriesLoading || peopleLoading;

  if (loading) {
    return <LoadingScreen />;
  }

  // For now, just show a simple layout with empty state
  const hasMemories = memories.length > 0;

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <BackButton />
            {/* TODO: Add CollapsibleButtonMenu here later */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-2">
              {language === 'ar' ? 'ذكريات العائلة' : 'Family Memories'}
            </h1>
            <div className="w-32 h-1 bg-accent mx-auto rounded-full"></div>
          </div>

          {/* Content Area */}
          {!hasMemories ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 mb-8 rounded-full bg-accent/10 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-text mb-3">
                {language === 'ar' ? 'لا توجد ذكريات بعد' : 'No memories yet'}
              </h2>

              <p className="text-lg text-text/70 mb-8 text-center max-w-md">
                {language === 'ar'
                  ? 'احفظ قصص العائلة للأجيال القادمة'
                  : 'Preserve family stories for generations to come'}
              </p>

              {/* TODO: Add "Add Memory" button here when edit mode is implemented */}
            </div>
          ) : (
            // Memories List
            <div className="space-y-12">
              {memories.map((memory, index) => {
                const storyteller = people.find((p) => p.id === memory.storytellerId);
                const storytellerName = storyteller
                  ? language === 'ar'
                    ? storyteller.nameAr
                    : storyteller.name
                  : '';

                const title = language === 'ar' ? memory.titleAr : memory.title;
                const caption = language === 'ar' ? memory.captionAr : memory.caption;

                // Format date
                const dateStr = memory.dateRecorded.toLocaleDateString(
                  language === 'ar' ? 'ar-EG' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                );

                // Format duration (MM:SS)
                const minutes = Math.floor(memory.durationSeconds / 60);
                const seconds = memory.durationSeconds % 60;
                const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                // Determine if this is the featured (first) memory
                const isFeatured = index === 0;

                return (
                  <div
                    key={memory.id}
                    className={`
                      ${isFeatured ? 'w-full' : 'w-full md:w-3/5'}
                      ${!isFeatured && index % 2 === 0 ? '' : 'md:ml-auto'}
                    `}
                  >
                    {/* Memory Card - Basic for now, will enhance with MemoryCard component */}
                    <div className="bg-card rounded-3xl p-6 shadow-sm">
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-text/10 rounded-2xl mb-4 overflow-hidden">
                        <img
                          src={memory.thumbnailUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-lg">
                            <svg
                              className="w-8 h-8 text-accent-text ml-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="text-2xl font-bold text-text mb-1">{title}</h3>
                        {caption && (
                          <p className="text-lg font-light text-text/70 mb-3">{caption}</p>
                        )}

                        {/* Metadata */}
                        <div className="text-base font-light text-accent">
                          {storytellerName} · {dateStr} · {durationStr}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
