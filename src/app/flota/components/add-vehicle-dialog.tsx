'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Vehicle, VehicleType } from '@/lib/types';
import { useEffect } from 'react';

const truckTypes = ['Cabeza Tractora', 'Semirremolque', 'Piso Móvil', 'Cisterna', 'Frigorífico', 'Lona', 'Portacontenedores', 'Cuba', 'Bañera', 'Portacoches', 'Tautliner'] as const;
const supportTypes = ['Motocicleta', 'Turismo/Otros', 'Furgoneta'] as const;
const allVehicleTypes = [...truckTypes, ...supportTypes];

interface AddVehicleDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'history' | 'status'>) => void;
  existingPlates: string[];
}

export function AddVehicleDialog({ isOpen, setIsOpen, onAddVehicle, existingPlates }: AddVehicleDialogProps) {
  
  const formSchema = z.object({
    plate: z.string().min(1, 'La matrícula es requerida.').refine(
        (plate) => !existingPlates.includes(plate.toUpperCase()),
        'Esta matrícula ya está registrada en tu flota.'
    ),
    type: z.enum([allVehicleTypes[0], ...allVehicleTypes.slice(1)] as [string, ...string[]], { message: 'Debes seleccionar un tipo de vehículo.' }),
    expiryDate: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plate: '',
      expiryDate: '',
    },
  });
  
  const selectedType = form.watch('type');
  const isSupportVehicle = supportTypes.includes(selectedType as any);
  
  useEffect(() => {
    if (isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = (data: FormValues) => {
    onAddVehicle({ 
        plate: data.plate.toUpperCase(), 
        type: data.type as any,
        expiryDate: isSupportVehicle ? data.expiryDate : undefined
    });
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
        <DialogTitle>Añadir Nuevo Vehículo</DialogTitle>
        <DialogDescription>
            Introduce los datos del vehículo para añadirlo a tu flota.
        </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                        <Input placeholder="1234ABC" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Vehículo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {allVehicleTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            {isSupportVehicle && (
                <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Fecha de Vencimiento de Autorización</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit">Añadir Vehículo</Button>
            </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
