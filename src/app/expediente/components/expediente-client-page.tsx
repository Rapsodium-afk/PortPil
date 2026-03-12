'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { CauRequest } from '@/lib/types';
import UserRequestsTable from './user-requests-table';
import UserDocumentsCard from './user-documents-card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Building2 } from 'lucide-react';

interface ExpedienteClientPageProps {
  allRequests: CauRequest[];
}

export default function ExpedienteClientPage({ allRequests }: ExpedienteClientPageProps) {
  const { user, activeCompany, isLoading } = useAuth();

  const userRequests = useMemo(() => {
    if (!user) return [];
    return allRequests.filter(req => req.userId === user.id);
  }, [allRequests, user]);
  
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <div>No se ha encontrado el usuario.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Expediente</h1>
        <p className="text-muted-foreground">
          Consulta el historial de tus solicitudes y los documentos de tu empresa.
        </p>
      </div>
      
      {activeCompany ? (
         <UserDocumentsCard company={activeCompany} />
      ) : (
        <Alert>
            <Building2 className="h-4 w-4" />
            <AlertTitle>Expediente de Empresa</AlertTitle>
            <AlertDescription>
                No tienes ninguna empresa activa seleccionada. Los documentos del expediente están asociados a una empresa.
            </AlertDescription>
        </Alert>
      )}

      <UserRequestsTable requests={userRequests} />

    </div>
  );
}
