import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { docToMemory } from '../services/firestore';
import { Memory } from '../types';

/**
 * Hook to get all memories with real-time updates
 * Sorted by dateRecorded descending (newest first)
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
        setMemories(memoriesData);
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
