import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_PROJECT } from './firebaseProject';

export { OWNER_EMAIL } from './firebaseProject';

// VITE_FIREBASE_* variables override the built-in project (e.g. to point a preview at another one).
const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || FIREBASE_PROJECT.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_PROJECT.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || FIREBASE_PROJECT.projectId,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_PROJECT.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || FIREBASE_PROJECT.appId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

export const app = initializeApp(
  isFirebaseConfigured ? firebaseConfig : { apiKey: 'demo-key', projectId: 'demo-project', appId: 'demo-app' }
);

export const auth = getAuth(app);
export const db = getFirestore(app);
