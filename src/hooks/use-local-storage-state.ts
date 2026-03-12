'use client';

import { useState, useEffect, useCallback } from 'react';

// This function checks if we are on the client side
const isClient = typeof window !== 'undefined';

/**
 * @deprecated This hook is deprecated. Data should be fetched from server actions instead.
 */
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        if (!isClient) {
            return defaultValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    const setLocalStorageState = useCallback((newState: T | ((prevState: T) => T)) => {
        if (!isClient) {
            return;
        }
        try {
            const valueToStore = newState instanceof Function ? newState(state) : newState;
            setState(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, state]);

    // This effect synchronizes state changes from other tabs/windows
    useEffect(() => {
        if (!isClient) {
            return;
        }
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setState(JSON.parse(e.newValue));
                } catch (error) {
                    console.warn(`Error parsing storage change for key “${key}”:`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    return [state, setLocalStorageState as React.Dispatch<React.SetStateAction<T>>];
}
