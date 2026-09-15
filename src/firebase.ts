import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, collection, onSnapshot, setDoc, deleteDoc, getDocs, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with default database
export const db = getFirestore(app);

export const auth = getAuth(app);

export { doc, collection, onSnapshot, setDoc, deleteDoc, getDocs, getDocFromServer };
export default app;
