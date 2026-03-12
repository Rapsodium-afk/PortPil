'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
});

export const FirebaseProvider = ({
  children,
  app,
  auth,
  firestore,
}: {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) => {
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => {
    const { app } = useFirebase();
    if (!app) throw new Error('Firebase App is not initialized.');
    return app;
}

export const useFirestore = () => {
    const { firestore } = useFirebase();
     if (!firestore) throw new Error('Firestore is not initialized.');
    return { firestore };
}

export const useAuth = () => {
    const { auth } = useFirebase();
    if (!auth) throw new Error('Firebase Auth is not initialized.');
    return { auth };
}
