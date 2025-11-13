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
        collection(db, 'people'),
        (snapshot) => {
          const peopleData = snapshot.docs.map((doc) =>
            docToPerson(doc.id, doc.data())
          );
          setPeople(peopleData);
          setLoading(false);
          setError(null);
          retryCount = 0; // Reset retry count on success
        },
        (err) => {
          console.error('Error fetching people:', err);
          
          // Check if it's a CORS/network error (common on iOS Safari)
          const isNetworkError = err.code === 'unavailable' || 
                                err.message?.includes('access control') ||
                                err.message?.includes('CORS') ||
                                err.message?.includes('network');
          
          if (isNetworkError && retryCount < maxRetries) {
            retryCount++;
            console.warn(`Retrying people fetch (attempt ${retryCount}/${maxRetries})...`);
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

  return { people, loading, error };
};

