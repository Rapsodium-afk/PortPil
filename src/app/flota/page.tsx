'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Fleet, Vehicle } from '@/lib/types';
import { getFleetByCompany, updateFleet, getAllFleets } from './actions';
import { useToast } from '@/hooks/use-toast';
import { FleetTable } from './components/fleet-table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Truck, Search, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { readData } from '@/lib/actions';
import { Company } from '@/lib/types';

export default function FlotaPage() {
  const { user, activeCompany, isLoading, isSoporteOperativo, isSoporteAduanas, isAdmin } = useAuth();
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [allFleets, setAllFleets] = useState<Fleet[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { toast } = useToast();

  const isSupportProfile = isAdmin || isSoporteOperativo || isSoporteAduanas;

  useEffect(() => {
    if (isSupportProfile) {
        readData<Company[]>('companies.json').then(setCompanies);
        getAllFleets().then(data => {
            setAllFleets(data);
            setIsPageLoading(false);
        });
    }
  }, [isSupportProfile]);

  useEffect(() => {
    if (!isSupportProfile && activeCompany) {
      setIsPageLoading(true);
      getFleetByCompany(activeCompany.name).then(data => {
        setFleet(data);
        setIsPageLoading(false);
      });
    } else if (!isSupportProfile && !isLoading) {
      setFleet(null);
      setIsPageLoading(false);
    }
  }, [activeCompany, isLoading, isSupportProfile]);

  const displayedVehicles = useMemo(() => {
    if (isSupportProfile) {
        if (selectedCompanyId === 'all') {
            return allFleets.flatMap(f => f.vehicles.map(v => ({ ...v, companyName: f.companyName })));
        } else {
            const company = companies.find(c => c.id === selectedCompanyId);
            const targetFleet = allFleets.find(f => f.companyName === company?.name);
            return targetFleet?.vehicles.map(v => ({ ...v, companyName: targetFleet.companyName })) || [];
        }
    }
    return fleet?.vehicles || [];
  }, [isSupportProfile, selectedCompanyId, allFleets, fleet, companies]);

  const handleFleetChange = async (updatedVehicles: Vehicle[]) => {
    const targetCompanyName = isSupportProfile 
        ? (selectedCompanyId === 'all' ? null : companies.find(c => c.id === selectedCompanyId)?.name)
        : activeCompany?.name;

    if (!targetCompanyName || !user) {
        toast({ title: "Acción no permitida", description: "Debes seleccionar una empresa específica para modificar su flota.", variant: "destructive"});
        return;
    }

    const result = await updateFleet(targetCompanyName, updatedVehicles, user.name);
    
    if (result.success && result.fleet) {
      if (isSupportProfile) {
          setAllFleets(prev => prev.map(f => f.companyName === targetCompanyName ? result.fleet! : f));
      } else {
          setFleet(result.fleet);
      }
      toast({
        title: "Flota actualizada",
        description: "Los cambios han sido guardados.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: result.message,
      });
    }
  };

  if (isLoading || isPageLoading) {
    return <div>Cargando gestor de flotas...</div>;
  }
  
  const canManageFleet = isSupportProfile || user?.roles.includes('Operador Logístico');

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestor de Flotas</h1>
            <p className="text-muted-foreground">
                {isSupportProfile 
                  ? "Panel de control de vehículos del puerto (Vista de Soporte)."
                  : `Gestiona los vehículos de la empresa (${activeCompany?.name}) en tiempo real.`}
            </p>
        </div>
        {isSupportProfile && (
            <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Seleccionar empresa..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las empresas</SelectItem>
                        {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </div>
      <FleetTable
        vehicles={displayedVehicles}
        onVehiclesChange={handleFleetChange}
        showCompanyColumn={isSupportProfile && selectedCompanyId === 'all'}
      />
    </div>
  );
}
