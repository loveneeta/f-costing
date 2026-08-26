import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAmqsh4kcQrdO7OyIdo-3j9CKUlF_PAFqo",
  authDomain: "f-costing.firebaseapp.com",
  databaseURL: "https://f-costing-default-rtdb.firebaseio.com",
  projectId: "f-costing",
  storageBucket: "f-costing.firebasestorage.app",
  messagingSenderId: "379144488657",
  appId: "1:379144488657:web:c5ccb237bc2f3a16cda7f0",
  measurementId: "G-KQ8KB93JXC"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Attempt browser local persistence first; fall back to inMemory persistence if blocked in iframe
setPersistence(auth, browserLocalPersistence).catch(() => {
  setPersistence(auth, inMemoryPersistence).catch((err) => {
    console.warn("[Firebase] Persistence setup notice:", err);
  });
});

export const db = getFirestore(app);
