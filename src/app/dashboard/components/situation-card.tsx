'use client';

import React, { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit2, Save, X, CheckCircle, XCircle, AlertTriangle, Users } from 'lucide-react';
import type { SituationZone, ZoneStatus, OperatingStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateZoneConfig } from '../actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

interface SituationCardProps {
  zone: SituationZone;
  onUpdate: () => Promise<void>;
}

const zoneStatuses = ['Solo para import', 'Import y Export', 'Solo para export', 'Solo salidas'] as const;
const operatingStatuses = ['Abierta', 'Cerrada', 'No operativa'] as const;

const formSchema = z.object({
  maxSpots: z.coerce.number().min(1, 'Debe haber al menos 1 plaza.'),
  status: z.enum(zoneStatuses),
  operatingStatus: z.enum(operatingStatuses),
  withStaff: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SituationCard({ zone, onUpdate }: SituationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const canEdit = useMemo(() => user?.roles.includes('Admin') || user?.roles.includes('Gestor Situacion'), [user]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      maxSpots: zone.maxSpots,
      status: zone.status,
      operatingStatus: zone.operatingStatus,
      withStaff: !!zone.withStaff,
    },
  });

  const occupancyPercentage = useMemo(() => {
    if (zone.maxSpots === 0) return 0;
    const usedSpots = zone.maxSpots - zone.freeSpots;
    return Math.round((usedSpots / zone.maxSpots) * 100);
  }, [zone]);
  
  const color = useMemo(() => {
    if (occupancyPercentage > 90) return 'bg-destructive';
    if (occupancyPercentage > 70) return 'bg-yellow-500';
    return 'bg-primary';
  }, [occupancyPercentage]);

  const onSubmit = async (data: FormValues) => {
    const result = await updateZoneConfig({ id: zone.id, ...data });
    if (result.success) {
      toast({
        title: 'Configuración guardada',
        description: `La zona ${zone.name} ha sido actualizada.`,
      });
      setIsEditing(false);
      await onUpdate();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: result.message,
      });
    }
  };

  const getOperatingStatusBadge = (status: OperatingStatus) => {
    switch (status) {
      case 'Abierta':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="mr-2 h-4 w-4" />
            Abierta
          </Badge>
        );
      case 'Cerrada':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-2 h-4 w-4" />
            Cerrada
          </Badge>
        );
      case 'No operativa':
        return (
          <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <AlertTriangle className="mr-2 h-4 w-4" />
            No operativa
          </Badge>
        );
    }
  };

  return (
    <Card>
        <TooltipProvider>
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div className="space-y-0.5">
            <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-medium">{zone.name}</CardTitle>
                {zone.withStaff && (
                    <Tooltip>
                        <TooltipTrigger>
                            <Users className="h-5 w-5 text-primary" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Zona con personal asignado</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <CardDescription>{zone.status}</CardDescription>
        </div>
        {canEdit && (
          <Popover open={isEditing} onOpenChange={setIsEditing}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => form.reset({ maxSpots: zone.maxSpots, status: zone.status, operatingStatus: zone.operatingStatus, withStaff: !!zone.withStaff })}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">Editar {zone.name}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(false)}><X className="h-4 w-4"/></Button>
                        </div>
                        <FormField
                            control={form.control}
                            name="maxSpots"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plazas Máximas</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Estado de la Zona</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {zoneStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="operatingStatus"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Estado Operativo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {operatingStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                          control={form.control}
                          name="withStaff"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-base">Con Personal</FormLabel>
                               </div>
                               <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                             </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Guardando...' : <><Save className="mr-2 h-4 w-4"/>Guardar</>}
                        </Button>
                    </form>
                </Form>
            </PopoverContent>
          </Popover>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-muted-foreground">Ocupación</span>
                <span className="text-2xl font-bold">{zone.maxSpots - zone.freeSpots} / {zone.maxSpots}</span>
            </div>
            <Progress value={occupancyPercentage} indicatorClassName={color} />
             <div className="flex justify-between items-baseline mt-1">
                <span className="text-xs text-muted-foreground">{occupancyPercentage}% Lleno</span>
                <span className="text-xs font-semibold text-green-600">{zone.freeSpots} Libres</span>
            </div>
        </div>
        <div className="flex items-center justify-center pt-2">
            {getOperatingStatusBadge(zone.operatingStatus)}
        </div>
      </CardContent>
      </TooltipProvider>
    </Card>
  );
}
