'use client';

import { useState } from 'react';
import { PlusCircle, History, AlertTriangle, Calendar, Info } from 'lucide-react';
import { format, isBefore, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { AddVehicleDialog } from './add-vehicle-dialog';
import { VehicleHistoryDialog } from './vehicle-history-dialog';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface FleetTableProps {
  vehicles: Vehicle[];
  onVehiclesChange: (vehicles: Vehicle[]) => void;
  showCompanyColumn?: boolean;
}

export function FleetTable({ vehicles, onVehiclesChange, showCompanyColumn }: FleetTableProps) {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleAddVehicle = (newVehicleData: Omit<Vehicle, 'history' | 'status'>) => {
    if (!user) return;
    const vehicleToAdd: Vehicle = {
      ...newVehicleData,
      status: 'Activo',
      history: [{
        action: 'Alta' as const,
        performedAt: new Date().toISOString(),
        performedBy: user.name,
      }]
    };
    onVehiclesChange([...vehicles, vehicleToAdd]);
  };
  
  const handleStatusChange = (plate: string, newStatus: boolean) => {
    if (!user) return;
    
    const updatedVehicles = vehicles.map(v => {
      if (v.plate === plate) {
        const status: Vehicle['status'] = newStatus ? 'Activo' : 'Inactivo';
        return {
          ...v,
          status: status,
          history: [
            ...v.history,
            {
              action: newStatus ? 'Alta' as const : 'Baja' as const,
              performedAt: new Date().toISOString(),
              performedBy: user.name
            }
          ]
        };
      }
      return v;
    });
    onVehiclesChange(updatedVehicles);
  };
  
  const openHistoryDialog = (vehicle: Vehicle) => {
    setHistoryVehicle(vehicle);
    setIsHistoryOpen(true);
  }

  const handleHistoryClose = (open: boolean) => {
    setIsHistoryOpen(open);
    if (!open) {
      setTimeout(() => {
        setHistoryVehicle(null);
      }, 300);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vehículos de la Flota</CardTitle>
            <CardDescription>Total de {vehicles.length} vehículos registrados.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Vehículo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {showCompanyColumn && <TableHead>Empresa</TableHead>}
                <TableHead>Matrícula</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Última Acción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showCompanyColumn ? 7 : 6} className="h-24 text-center text-muted-foreground">
                    No hay vehículos en la flota.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map(vehicle => {
                  const isExpired = vehicle.expiryDate ? isBefore(parseISO(vehicle.expiryDate), new Date()) : false;
                  const isSoonExpiring = vehicle.expiryDate ? (!isExpired && isBefore(parseISO(vehicle.expiryDate), addMonths(new Date(), 1))) : false;

                  return (
                    <TableRow key={vehicle.plate} className={isExpired ? "bg-destructive/10" : ""}>
                      {showCompanyColumn && <TableCell className="font-semibold">{vehicle.companyName || '-'}</TableCell>}
                      <TableCell className="font-mono flex items-center gap-2">
                        {vehicle.plate}
                        {isExpired && (
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger><AlertTriangle className="h-4 w-4 text-destructive" /></TooltipTrigger>
                              <TooltipContent>Autorización CADUCADA</TooltipContent>
                            </Tooltip>
                           </TooltipProvider>
                        )}
                        {isSoonExpiring && (
                           <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger><Info className="h-4 w-4 text-yellow-500" /></TooltipTrigger>
                              <TooltipContent>Autorización próxima a caducar</TooltipContent>
                            </Tooltip>
                           </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                            {vehicle.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicle.status === 'Activo' && !isExpired ? 'default' : 'secondary'}>
                          {isExpired ? 'Caducado' : vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vehicle.expiryDate ? (
                            <div className={`flex items-center gap-1 text-xs ${isExpired ? 'text-destructive font-bold' : isSoonExpiring ? 'text-yellow-600 font-medium' : ''}`}>
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(vehicle.expiryDate), 'dd/MM/yyyy')}
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-xs italic">N/A (Fact. Mensual)</span>
                        )}
                      </TableCell>
                       <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(vehicle.history[vehicle.history.length-1].performedAt), 'dd MMM yyyy', { locale: es })}
                       </TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                              checked={vehicle.status === 'Activo'}
                              onCheckedChange={(checked) => handleStatusChange(vehicle.plate, checked)}
                              aria-label={`Estado de ${vehicle.plate}`}
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => openHistoryDialog(vehicle)}>
                          <History className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddVehicleDialog
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        onAddVehicle={handleAddVehicle}
        existingPlates={vehicles.map(v => v.plate)}
      />
      <VehicleHistoryDialog
        vehicle={historyVehicle}
        isOpen={isHistoryOpen}
        setIsOpen={handleHistoryClose}
      />
    </>
  );
}
