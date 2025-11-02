import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { docToPerson } from '../services/firestore';
import { Person } from '../types';

/**
 * Hook to get a single person with real-time updates
 * @param personId - ID of the person to fetch
 * @returns Object with person data, loading state, and error
 */
export const usePerson = (personId: string | undefined) => {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!personId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'people', personId),
      (docSnap) => {
        if (docSnap.exists()) {
          setPerson(docToPerson(docSnap.id, docSnap.data()));
        } else {
          setPerson(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching person:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [personId]);

  return { person, loading, error };
};

