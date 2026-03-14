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
  const { user, isAdmin, impersonation, setImpersonation, userCompanies } = useAuth();
  const [allCompanies, setAllCompanies] = React.useState<Company[]>([]);

  // Only show for real Admins
  if (!user?.roles.includes('Admin')) return null;

  const roles: UserRole[] = [
    'Soporte Operativo',
    'Soporte Aduanas',
    'Media Manager',
    'Operador Logístico',
    'Transitario',
    'Agente de Aduanas',
    'Gestor Situacion',
    'Operador Situacion',
    'Aduana'
  ];

  // Fetch all companies to allow impersonating any company context
  React.useEffect(() => {
    readData<Company[]>('companies.json').then(setAllCompanies);
  }, []);

  const handleImpersonate = (role: UserRole) => {
    // If it's a company-specific role, maybe select a company too?
    // For now just the role.
    setImpersonation(role, impersonation.companyId);
  };

  const handleSetCompany = (companyId: string | null) => {
    setImpersonation(impersonation.role, companyId);
  };

  const clearImpersonation = () => {
    setImpersonation(null, null);
  };

  return (
    <div className="flex items-center gap-2">
      {impersonation.role && (
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
          <DropdownMenuItem onClick={clearImpersonation} className="text-destructive font-bold">
            <XCircle className="mr-2 h-4 w-4" />
            Restablecer Vista Real
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
