import { useMemories } from '../hooks/useMemories';
import { usePeople } from '../hooks/usePeople';
import { useLanguage } from '../context/LanguageContext';
import BackButton from '../components/BackButton';
import LoadingScreen from '../components/LoadingScreen';
import { MemoryCard } from '../components/MemoryCard';

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

                return (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    storytellerName={storytellerName}
                    isFeatured={index === 0}
                    index={index}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
