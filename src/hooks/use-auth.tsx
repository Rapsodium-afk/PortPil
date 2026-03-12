'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Company } from '@/lib/types';
import { readData, writeData } from '@/lib/actions';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  users: User[];
  setUsers: (users: User[]) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  userCompanies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [appUser, setAppUser] = useState<User | null>(null);
  const [users, setUsersState] = useState<User[]>([]);
  
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  
  const fetchAllUsers = useCallback(async () => {
    const fetchedUsers = await readData<User[]>('users.json');
    setUsersState(fetchedUsers);
  }, []);

  const isClient = typeof window !== 'undefined';

  const setActiveCompany = (company: Company | null) => {
    setActiveCompanyState(company);
    if (isClient) {
      if (company) {
        localStorage.setItem('portpilot-active-company-id', company.id);
      } else {
        localStorage.removeItem('portpilot-active-company-id');
      }
    }
  }

  const loadUserContext = useCallback(async (loggedInUser: User) => {
    const allCompanies = await readData<Company[]>('companies.json');
    const companiesForUser = allCompanies.filter(c => loggedInUser.companyIds?.includes(c.id));
    setUserCompanies(companiesForUser);

    if (companiesForUser.length > 0) {
      const storedCompanyId = isClient ? localStorage.getItem('portpilot-active-company-id') : null;
      const companyToActivate = companiesForUser.find(c => c.id === storedCompanyId) || companiesForUser[0];
      setActiveCompanyState(companyToActivate);
    } else {
      setActiveCompanyState(null);
    }
  }, [isClient]);


  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      await fetchAllUsers();
      if (isClient) {
        try {
          const storedUser = localStorage.getItem('portpilot-user');
          if (storedUser) {
            const user: User = JSON.parse(storedUser);
            setAppUser(user);
            await loadUserContext(user);
          }
        } catch (e) {
          console.error("Failed to load user from localStorage", e);
          localStorage.removeItem('portpilot-user');
        }
      }
      setIsLoading(false);
    }
    initializeAuth();
  }, [fetchAllUsers, loadUserContext, isClient]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message:string; }> => {
    const allUsers = await readData<User[]>('users.json');
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser || foundUser.password !== password) {
        return { success: false, message: 'El email o la contraseña son incorrectos. Por favor, inténtalo de nuevo.' };
    }

    if (foundUser.status !== 'active') {
        return { success: false, message: 'Esta cuenta está pendiente de aprobación por un administrador.' };
    }

    const userToStore = { ...foundUser };
    delete userToStore.password;

    setAppUser(userToStore);
    if (isClient) {
      localStorage.setItem('portpilot-user', JSON.stringify(userToStore));
    }
    await loadUserContext(userToStore);

    return { success: true, message: 'Inicio de sesión exitoso.' };
  }, [loadUserContext, isClient]);

  const logout = useCallback(() => {
    setAppUser(null);
    setActiveCompanyState(null);
    setUserCompanies([]);
    if (isClient) {
      localStorage.removeItem('portpilot-user');
      localStorage.removeItem('portpilot-active-company-id');
    }
    router.push('/login');
  }, [router, isClient]);
  
  const setUsers = async (newUsers: User[]) => {
    setUsersState(newUsers);
    await writeData('users.json', newUsers);
  }

  return (
    <AuthContext.Provider value={{ user: appUser, login, logout, isLoading, users, setUsers, fetchAllUsers, userCompanies, activeCompany, setActiveCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
