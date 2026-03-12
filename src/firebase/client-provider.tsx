'use client';

import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

// This component is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the main application layout.
export default function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const { app, auth, firestore } = initializeFirebase();

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
