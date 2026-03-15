'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Company, SystemConfig, ModulePersistence } from '@/lib/types';
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
  isAdmin: boolean;
  isSoporte: boolean;
  isSoporteOperativo: boolean;
  isSoporteAduanas: boolean;
  isMediaManager: boolean;
  isOperadorLogistico: boolean;
  isSituación: boolean;
  isAduana: boolean;
  config: SystemConfig | null;
  impersonation: { role: string | null; companyId: string | null; userId: string | null };
  setImpersonation: (role: string | null, companyId: string | null, userId?: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [appUser, setAppUser] = useState<User | null>(null);
  const [users, setUsersState] = useState<User[]>([]);
  
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [impersonation, setImpersonationState] = useState<{ role: string | null; companyId: string | null; userId: string | null }>({ role: null, companyId: null, userId: null });
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<SystemConfig | null>(null);

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

  useEffect(() => {
    const loadConfig = async () => {
      const cfg = await readData<SystemConfig>('config.json');
      setConfig(cfg);
    };
    loadConfig();
  }, []);

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

  const setImpersonation = async (role: string | null, companyId: string | null, userId: string | null = null) => {
    if (!appUser?.roles.includes('Admin')) return;
    
    setImpersonationState({ role, companyId, userId });
    
    if (userId) {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser) {
        await loadUserContext(targetUser);
      }
    } else if (companyId) {
      const allCompanies = await readData<Company[]>('companies.json');
      const company = allCompanies.find(c => c.id === companyId);
      if (company) setActiveCompanyState(company);
    } else {
      loadUserContext(appUser);
    }
  };

  const isAdmin = !!appUser?.roles?.includes('Admin');
  const isMediaManager = !!appUser?.roles?.includes('Media Manager');

  return (
    <AuthContext.Provider value={{
        user: appUser,
        isLoading,
        login,
        logout,
        users,
        setUsers,
        fetchAllUsers,
        userCompanies,
        activeCompany,
        setActiveCompany,
        isAdmin,
        isSoporte: !!appUser?.roles?.includes('Soporte'),
        isSoporteOperativo: !!appUser?.roles?.includes('Soporte Operativo'),
        isSoporteAduanas: !!appUser?.roles?.includes('Soporte Aduanas'),
        isMediaManager,
        isOperadorLogistico: !!appUser?.roles?.includes('Operador Logístico'),
        isSituación: !!appUser?.roles?.includes('Gestor Situación') || !!appUser?.roles?.includes('Operador Situación'),
        isAduana: !!appUser?.roles?.includes('Aduana') || !!appUser?.roles?.includes('Agente de Aduanas'),
        config,
        impersonation,
        setImpersonation
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { user, impersonation, users } = context;

  // Derive target user based on impersonation
  const impersonatedUser = impersonation.userId ? users.find(u => u.id === impersonation.userId) : null;
  const effectiveUser = impersonatedUser || user;

  // Derive roles and flags based on impersonation
  const roles = impersonation.role ? [impersonation.role] : (effectiveUser?.roles || []);
  const isAdmin = roles.includes('Admin');
  const isSoporte = roles.includes('Soporte');
  const isSoporteOperativo = roles.includes('Soporte Operativo');
  const isSoporteAduanas = roles.includes('Soporte Aduanas');
  const isMediaManager = roles.includes('Media Manager');
  const isOperadorLogistico = roles.includes('Operador Logístico');
  const isSituación = roles.includes('Gestor Situación') || roles.includes('Operador Situación');
  const isAduana = roles.includes('Aduana') || isSoporteAduanas;

  return {
    ...context,
    user: effectiveUser, // Use the effective user (impersonated or real)
    roles,
    isAdmin,
    isSoporte,
    isSoporteOperativo,
    isSoporteAduanas,
    isMediaManager,
    isOperadorLogistico,
    isSituación,
    isAduana,
    isImpersonating: !!impersonation.role
  };
};
