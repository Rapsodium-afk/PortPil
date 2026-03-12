'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useDoc<T = DocumentData>(path: string) {
  const { firestore } = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) return;
    
    // Ensure path has an even number of segments
    if (path.split('/').length % 2 !== 0) {
        // This is likely a collection path, not a doc path
        // You might want to handle this case, e.g., by setting an error
        setError(new Error("Invalid document path provided to useDoc."));
        setIsLoading(false);
        return;
    }

    const docRef = doc(firestore, path);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          setData({ ...doc.data(), id: doc.id } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error(`Error fetching doc from ${path}:`, err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, isLoading, error };
}
