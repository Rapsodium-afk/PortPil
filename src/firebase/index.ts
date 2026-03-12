import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import { useFirebase, useFirebaseApp, useFirestore, useAuth, FirebaseProvider } from './provider';
import FirebaseClientProvider from './client-provider';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  if (typeof window !== 'undefined' && !getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);
    } catch (e) {
      console.error('Failed to initialize Firebase', e);
      // You might want to throw an error or handle this case appropriately
    }
  }
  return { app, auth, firestore };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useDoc,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
