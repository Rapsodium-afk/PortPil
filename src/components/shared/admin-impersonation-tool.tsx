'use client';

import React from 'react';
import { UserRole, Company } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ShieldAlert, User, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { readData } from '@/lib/actions';

export function AdminImpersonationTool() {
  const { user, isAdmin, impersonation, setImpersonation, userCompanies, users } = useAuth();
  const [allCompanies, setAllCompanies] = React.useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch all companies to allow impersonating any company context
  React.useEffect(() => {
    readData<Company[]>('companies.json').then(setAllCompanies);
  }, []);

  // Use the original user from context to check if they are an admin
  // since 'user' might be overridden by impersonation
  const isRealAdmin = user?.roles.includes('Admin') || impersonation.userId !== null || impersonation.role !== null;
  // Actually, we can just check if we are impersonating. 
  // If we are impersonating, we MUST have been an admin to start with.
  
  if (!user?.roles.includes('Admin') && !impersonation.userId && !impersonation.role) return null;

  const roles: UserRole[] = [
    'Soporte',
    'Soporte',
    'Media Manager',
    'Operador Logístico',
    'Transitario',
    'Agente de Aduanas',
    'Gestor Situación',
    'Operador Situación',
    'Aduana'
  ];


  const handleImpersonate = (role: UserRole) => {
    // If it's a company-specific role, maybe select a company too?
    // For now just the role.
    setImpersonation(role, impersonation.companyId);
  };

  const handleSetCompany = (companyId: string | null) => {
    setImpersonation(impersonation.role, companyId);
  };

  const handleSetUser = (userId: string | null) => {
    setImpersonation(null, null, userId);
  };

  const clearImpersonation = () => {
    setImpersonation(null, null, null);
  };

  const filteredUsers = searchQuery.trim() === '' 
    ? users.slice(0, 5) 
    : users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);

  return (
    <div className="flex items-center gap-2">
      {impersonation.userId && (
        <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
          <ShieldAlert className="h-3 w-3" />
          Viendo como: {users.find(u => u.id === impersonation.userId)?.name || 'Usuario'}
        </Badge>
      )}
      {impersonation.role && !impersonation.userId && (
        <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
          <ShieldAlert className="h-3 w-3" />
          Viendo como: {impersonation.role}
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1 border-dashed border-primary text-primary">
            <User className="h-4 w-4" />
            Admin View As...
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Probar como Rol</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {roles.map(role => (
            <DropdownMenuItem 
              key={role} 
              onClick={() => handleImpersonate(role)}
              className={impersonation.role === role ? 'bg-secondary font-bold' : ''}
            >
              {role}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Probar como Empresa</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-48 overflow-auto">
            <DropdownMenuItem onClick={() => handleSetCompany(null)} className={!impersonation.companyId ? 'font-bold' : ''}>
              (Por defecto)
            </DropdownMenuItem>
            {allCompanies.map(company => (
              <DropdownMenuItem 
                key={company.id} 
                onClick={() => handleSetCompany(company.id)}
                className={impersonation.companyId === company.id ? 'bg-secondary font-bold' : ''}
              >
                {company.name}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Probar como Usuario</DropdownMenuLabel>
          <div className="px-2 py-1">
            <input 
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Buscar usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-48 overflow-auto">
            {filteredUsers.map(u => (
              <DropdownMenuItem 
                key={u.id} 
                onClick={() => handleSetUser(u.id)}
                className={impersonation.userId === u.id ? 'bg-secondary font-bold' : ''}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </div>
              </DropdownMenuItem>
            ))}
            {filteredUsers.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                No se encontraron usuarios
              </div>
            )}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={clearImpersonation} className="text-destructive font-bold">
            <XCircle className="mr-2 h-4 w-4" />
            Restablecer Vista Real
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
