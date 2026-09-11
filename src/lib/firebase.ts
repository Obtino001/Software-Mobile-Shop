import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(firebaseConfig.apiKey) &&
    !firebaseConfig.apiKey.includes('your_api_key')
  );
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Diagnostic helper to verify Firebase configuration
 */
export async function testFirebaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: any;
}> {
  if (!isFirebaseConfigured()) {
    return {
      connected: false,
      message: 'Firebase credentials are not configured in .env',
    };
  }

  // With Firebase, initialization succeeds unless the config is drastically malformed.
  // We assume connected if config is present. Real connection test would require a query.
  return {
    connected: true,
    message: 'Firebase initialized with configuration',
  };
}
