import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { docToMemory } from '../services/firestore';
import { Memory } from '../types';

/**
 * Hook to get all memories with real-time updates
 * Sorted by featured first, then dateRecorded descending (newest first)
 * @returns Object with memories array, loading state, and error
 */
export const useMemories = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Query with orderBy for server-side sorting (more efficient)
    const q = query(
      collection(db, 'memories'),
      orderBy('dateRecorded', 'desc')
    );

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupListener = () => {
      // Clean up previous listener if retrying
      if (unsubscribe) {
        unsubscribe();
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const memoriesData = snapshot.docs.map((doc) =>
            docToMemory(doc.id, doc.data())
          );

          // Sort: featured first, then by dateRecorded
          const sorted = memoriesData.sort((a, b) => {
            // Featured memories come first
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            // If both featured or both not featured, sort by date
            return b.dateRecorded.getTime() - a.dateRecorded.getTime();
          });

          setMemories(sorted);
          setLoading(false);
          setError(null);
          retryCount = 0; // Reset retry count on success
        },
        (err) => {
          console.error('Error fetching memories:', err);
          
          // Check if it's a CORS/network error (common on iOS Safari)
          const isNetworkError = err.code === 'unavailable' || 
                                err.message?.includes('access control') ||
                                err.message?.includes('CORS') ||
                                err.message?.includes('network');
          
          if (isNetworkError && retryCount < maxRetries) {
            retryCount++;
            console.warn(`Retrying memory fetch (attempt ${retryCount}/${maxRetries})...`);
            retryTimeout = setTimeout(setupListener, retryDelay * retryCount);
          } else {
            setError(err as Error);
            setLoading(false);
          }
        }
      );
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  return { memories, loading, error };
};
