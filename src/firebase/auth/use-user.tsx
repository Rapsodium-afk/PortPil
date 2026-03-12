'use client';

import { useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type Auth,
  type User
} from 'firebase/auth';
import { useFirebase } from '../provider';

export function useUser() {
  const { app } = useFirebase();
  const auth = app ? getAuth(app) : null;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signin = (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = (email: string, pass: string) => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    return signOut(auth);
  };

  return { user, isLoading, signin, signup, logout };
}
