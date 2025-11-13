import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Detect iOS Safari
const isIOSSafari = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
};

// Enable offline persistence asynchronously (non-blocking)
// Skip on iOS Safari due to known CORS issues with Firestore real-time listeners
// This ensures auth initialization is not delayed
const initializePersistence = async () => {
  // Skip persistence on iOS Safari to avoid CORS issues with Firestore Listen channel
  if (isIOSSafari()) {
    console.warn('Skipping offline persistence on iOS Safari to avoid CORS issues');
    return;
  }

  try {
    await enableIndexedDbPersistence(db);
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Offline persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Offline persistence not available in this browser');
    }
  }
};

// Initialize persistence without blocking
initializePersistence();

export default app;
