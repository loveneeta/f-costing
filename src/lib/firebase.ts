import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics init error in restricted iframe environments
  });
}

export const auth = getAuth(app);

// Attempt browser local persistence first; fall back to inMemory persistence if blocked in iframe
setPersistence(auth, browserLocalPersistence).catch(() => {
  setPersistence(auth, inMemoryPersistence).catch((err) => {
    console.warn("[Firebase] Persistence setup notice:", err);
  });
});

export const db = getFirestore(app);

