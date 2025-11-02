import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { docToPerson } from '../services/firestore';
import { Person } from '../types';

/**
 * Hook to get all people with real-time updates
 * @returns Object with people array, loading state, and error
 */
export const usePeople = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'people'),
      (snapshot) => {
        const peopleData = snapshot.docs.map((doc) =>
          docToPerson(doc.id, doc.data())
        );
        setPeople(peopleData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching people:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { people, loading, error };
};

