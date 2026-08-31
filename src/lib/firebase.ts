import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "missing-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "missing-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "missing-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "missing-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "missing-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "missing-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "missing-measurement-id",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "missing-database-url",
};

let app: FirebaseApp | undefined;
let auth: any = null;
let db: any = null;
let analytics: any = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} catch (e) {
  console.warn("Firebase initialization skipped", e);
}

if (app) {
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});
  }

  try {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {
      setPersistence(auth, inMemoryPersistence).catch((err) => {
        console.warn("[Firebase] Persistence setup notice:", err);
      });
    });
  } catch (e) {
    console.error("Failed to initialize Firebase Auth", e);
    // Create a dummy auth object to prevent immediate crashes in components 
    // that destructure or use auth before checking
    auth = { currentUser: null }; 
  }

  try {
    db = getFirestore(app);
  } catch (e) {
    console.error("Failed to initialize Firestore", e);
    db = {}; 
  }
}

export { auth, db, analytics };
