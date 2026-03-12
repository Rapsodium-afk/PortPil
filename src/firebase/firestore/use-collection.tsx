'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type CollectionReference,
  type Query
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface UseCollectionOptions {
  q?: {
    field: string;
    operator: '===' | '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
    value: any;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  startAfter?: any;
}

export function useCollection<T = DocumentData>(
  path: string,
  options?: UseCollectionOptions
) {
  const { firestore } = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    };

    let colQuery: Query | CollectionReference = collection(firestore, path);
    if (options?.q) {
      colQuery = query(colQuery, where(options.q.field, options.q.operator, options.q.value));
    }
    if (options?.sort) {
      colQuery = query(colQuery, orderBy(options.sort.field, options.sort.direction));
    }
    if (options?.limit) {
      colQuery = query(colQuery, limit(options.limit));
    }
     if (options?.startAfter) {
      colQuery = query(colQuery, startAfter(options.startAfter));
    }

    const unsubscribe = onSnapshot(
      colQuery,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as T);
        setData(docs);
        setIsLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path, options]);

  return { data, isLoading, error };
}
