import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialLoadComplete: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Centralized state management - prevent race conditions with multiple timers
  const completedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const minLoadingTime = 2100; // Minimum 2.1 seconds to show full cedar animation (1.8s animation + 0.3s buffer)

    // Centralized completion handler - ensures state is only set once
    const completeInitialization = () => {
      if (completedRef.current) return; // Already completed, prevent duplicate state updates
      completedRef.current = true;

      setLoading(false);
      setInitialLoadComplete(true);

      // Clean up any pending timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    };

    // Set a timeout to prevent infinite loading if auth fails to initialize
    timeoutRef.current = setTimeout(() => {
      console.error('Auth initialization timeout');
      completeInitialization();
    }, 5000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);

        // Ensure minimum loading time for animation
        const elapsed = Date.now() - startTime;
        const remaining = minLoadingTime - elapsed;

        if (remaining > 0) {
          delayTimerRef.current = setTimeout(() => {
            completeInitialization();
          }, remaining);
        } else {
          completeInitialization();
        }
      },
      (error) => {
        console.error('Auth state change error:', error);

        // Ensure minimum loading time even on error
        const elapsed = Date.now() - startTime;
        const remaining = minLoadingTime - elapsed;

        if (remaining > 0) {
          delayTimerRef.current = setTimeout(() => {
            completeInitialization();
          }, remaining);
        } else {
          completeInitialization();
        }
      }
    );

    return () => {
      // Clean up all timers on unmount
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, loading, initialLoadComplete, signIn, signOut }),
    [user, loading, initialLoadComplete, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
