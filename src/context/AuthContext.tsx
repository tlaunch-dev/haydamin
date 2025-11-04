import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    const startTime = Date.now();
    const minLoadingTime = 2100; // Minimum 2.1 seconds to show full cedar animation (1.8s animation + 0.3s buffer)
    
    // Set a timeout to prevent infinite loading if auth fails to initialize
    const timeout = setTimeout(() => {
      console.error('Auth initialization timeout');
      setLoading(false);
      setInitialLoadComplete(true);
    }, 5000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        clearTimeout(timeout);
        setUser(user);
        
        // Ensure minimum loading time for animation
        const elapsed = Date.now() - startTime;
        const remaining = minLoadingTime - elapsed;
        
        if (remaining > 0) {
          setTimeout(() => {
            setLoading(false);
            setInitialLoadComplete(true);
          }, remaining);
        } else {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      },
      (error) => {
        clearTimeout(timeout);
        console.error('Auth state change error:', error);
        
        // Ensure minimum loading time even on error
        const elapsed = Date.now() - startTime;
        const remaining = minLoadingTime - elapsed;
        
        if (remaining > 0) {
          setTimeout(() => {
            setLoading(false);
            setInitialLoadComplete(true);
          }, remaining);
        } else {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialLoadComplete, signIn, signOut }}>
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
