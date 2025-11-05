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

    const unsubscribe = onSnapshot(
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
      },
      (err) => {
        console.error('Error fetching memories:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { memories, loading, error };
};
