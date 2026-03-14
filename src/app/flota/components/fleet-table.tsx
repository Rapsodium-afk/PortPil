'use client';

import { useState } from 'react';
import { PlusCircle, History, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';
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

interface FleetTableProps {
  vehicles: Vehicle[];
  onVehiclesChange: (vehicles: Vehicle[]) => void;
}

export function FleetTable({ vehicles, onVehiclesChange }: FleetTableProps) {
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
                <TableHead>Matrícula</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Acción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No hay vehículos en tu flota. Empieza añadiendo uno.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map(vehicle => (
                  <TableRow key={vehicle.plate}>
                    <TableCell className="font-mono">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.type}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.status === 'Activo' ? 'default' : 'secondary'}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                     <TableCell>
                        {format(new Date(vehicle.history[vehicle.history.length-1].performedAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                     </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <div className="flex items-center gap-2">
                        <ToggleLeft className="h-4 w-4 text-muted-foreground"/>
                        <Switch
                            checked={vehicle.status === 'Activo'}
                            onCheckedChange={(checked) => handleStatusChange(vehicle.plate, checked)}
                            aria-label={`Estado de ${vehicle.plate}`}
                        />
                        <ToggleRight className="h-4 w-4 text-muted-foreground"/>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openHistoryDialog(vehicle)}>
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
