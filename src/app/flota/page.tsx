'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Fleet, Vehicle } from '@/lib/types';
import { getFleetByCompany, updateFleet } from './actions';
import { useToast } from '@/hooks/use-toast';
import { FleetTable } from './components/fleet-table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Truck } from 'lucide-react';

export default function FlotaPage() {
  const { user, activeCompany, isLoading } = useAuth();
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { toast } = useToast();

  const companyName = useMemo(() => activeCompany?.name, [activeCompany]);

  useEffect(() => {
    if (companyName) {
      setIsPageLoading(true);
      getFleetByCompany(companyName).then(data => {
        setFleet(data);
        setIsPageLoading(false);
      });
    } else if (!isLoading) {
      // If there's no active company, we are not loading.
      setFleet(null);
      setIsPageLoading(false);
    }
  }, [companyName, isLoading]);

  const handleFleetChange = async (updatedVehicles: Vehicle[]) => {
    if (!companyName || !user) return;

    const result = await updateFleet(companyName, updatedVehicles, user.name);
    
    if (result.success && result.fleet) {
      setFleet(result.fleet);
      toast({
        title: "Flota actualizada",
        description: "Los cambios en tu flota han sido guardados.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: result.message,
      });
      // If update failed, refetch to revert optimistic update
      if (companyName) {
        getFleetByCompany(companyName).then(data => setFleet(data));
      }
    }
  };

  if (isLoading || isPageLoading) {
    return <div>Cargando gestor de flotas...</div>;
  }
  
  const canManageFleet = user?.roles.includes('Operador Logístico') || user?.roles.includes('Admin');

  if (!canManageFleet) {
      return (
        <Alert variant="destructive">
            <Truck className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>
                No tienes los permisos necesarios para acceder al gestor de flotas.
            </AlertDescription>
        </Alert>
      );
  }

  if (!activeCompany) {
    return (
        <Alert>
            <Truck className="h-4 w-4" />
            <AlertTitle>Ninguna empresa seleccionada</AlertTitle>
            <AlertDescription>
                Por favor, selecciona una empresa desde el menú superior para gestionar su flota.
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestor de Flotas</h1>
        <p className="text-muted-foreground">
            Gestiona los vehículos de la empresa ({activeCompany.name}) en tiempo real.
        </p>
      </div>
      <FleetTable
        vehicles={fleet?.vehicles || []}
        onVehiclesChange={handleFleetChange}
      />
    </div>
  );
}
