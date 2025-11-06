import { useState } from 'react';
import { useMemories } from '../hooks/useMemories';
import { usePeople } from '../hooks/usePeople';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import LoadingScreen from '../components/LoadingScreen';
import { MemoryCard } from '../components/MemoryCard';
import { MemoryUploadModal } from '../components/MemoryUploadModal';
import { MemoryTimelineConnector } from '../components/MemoryTimelineConnector';
import { Plus } from 'lucide-react';

export function MemoriesPage() {
  const { memories, loading: memoriesLoading } = useMemories();
  const { people, loading: peopleLoading } = usePeople();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const loading = memoriesLoading || peopleLoading;

  if (loading) {
    return <LoadingScreen />;
  }

  // For now, just show a simple layout with empty state
  const hasMemories = memories.length > 0;

  return (
    <div className="min-h-screen bg-background text-text overflow-x-hidden">
      {/* Back Button - Fixed at top left */}
      <div className="fixed top-6 left-6 z-50">
        <BackButton />
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 pt-20 sm:pt-24 md:pt-20 min-h-screen relative overflow-hidden">
        {/* Header */}
        <div className="mb-3 md:mb-4 lg:mb-5 max-w-7xl mx-auto w-full relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text">
              {language === 'ar' ? 'ذكريات العائلة' : 'Memories'}
            </h1>
          </div>
        </div>

        {/* Content wrapper - matches FamilyHub pattern */}
        <div className="max-w-7xl mx-auto w-full relative z-10">

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

              {user && (
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-8 py-4 rounded-xl bg-accent text-accent-text font-medium hover:bg-accent-warm transition-colors shadow-lg"
                >
                  {language === 'ar' ? 'إضافة ذكرى' : 'Add Memory'}
                </button>
              )}
            </div>
          ) : (
            // Memories List with Timeline Connector
            <div className="relative max-w-5xl mx-auto">
              {/* Timeline connector visible beside cards */}
              <MemoryTimelineConnector
                memoryCount={memories.length}
                featuredIndex={memories.findIndex((m) => m.featured)}
              />

              {/* Memory cards */}
              <div className="relative space-y-3 md:space-y-4 lg:space-y-5" style={{ zIndex: 20 }}>
                {memories.map((memory, index) => {
                  // Calculate non-featured index for proper alternating pattern
                  // Featured cards are centered, so we only alternate non-featured cards
                  const nonFeaturedIndex = memories.slice(0, index).filter(m => !m.featured).length;

                  return (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      people={people}
                      isFeatured={memory.featured || false}
                      index={index}
                      nonFeaturedIndex={nonFeaturedIndex}
                      isExpanded={expandedCardId === memory.id}
                      onExpand={() => setExpandedCardId(memory.id)}
                      onCollapse={() => setExpandedCardId(null)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) - only show if user is authenticated and there are memories */}
      {user && hasMemories && (
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent text-accent-text shadow-2xl hover:bg-accent-warm transition-all hover:scale-105 flex items-center justify-center z-40"
          aria-label={language === 'ar' ? 'إضافة ذكرى' : 'Add Memory'}
        >
          <Plus className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      )}

      {/* Upload Modal */}
      <MemoryUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        people={people}
        onSuccess={() => {
          // Modal will close automatically, memories will update via real-time listener
          console.log('Memory uploaded successfully');
        }}
      />
    </div>
  );
}
