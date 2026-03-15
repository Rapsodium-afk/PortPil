'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SituationZone, ZoneStatus, OperatingStatus, SystemConfig } from '@/lib/types';
import { readData } from '@/lib/actions';
import { useAuth } from '@/hooks/use-auth';
import { updateSituation, updateSituationInstructions } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, AlertTriangle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const zoneStatuses = ['Solo para import', 'Import y Export', 'Solo para export', 'Solo salidas'] as const;
const operatingStatuses = ['Abierta', 'Cerrada', 'No operativa'] as const;

const formSchema = z.object({
  zones: z.array(z.object({
    id: z.string(),
    name: z.string(),
    freeSpots: z.coerce.number().min(0, 'No puede ser negativo.'),
    maxSpots: z.number(),
    status: z.enum(zoneStatuses),
    operatingStatus: z.enum(operatingStatuses),
    withStaff: z.boolean(),
  })).refine(
    (zones) => zones.every(z => z.freeSpots <= z.maxSpots),
    {
      message: 'Las plazas libres no pueden superar las plazas máximas.',
      path: ['zones'],
    }
  ),
});

type FormValues = z.infer<typeof formSchema>;

function InstructionsEditor({ initialInstructions }: { initialInstructions: string }) {
    const [instructions, setInstructions] = useState(initialInstructions);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateSituationInstructions(instructions);
        if (result.success) {
            toast({ title: 'Éxito', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Info className="mr-2"/>Manual de Uso y Prioridades</CardTitle>
                <CardDescription>Edita aquí las instrucciones para la gestión de esta página.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={8}
                    placeholder="Describe los procedimientos, prioridades o cualquier otra información relevante..."
                />
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Instrucciones
                </Button>
            </CardContent>
        </Card>
    );
}

export default function SituationPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [initialConfig, setInitialConfig] = useState<SystemConfig | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      zones: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'zones',
  });

  useEffect(() => {
    async function fetchData() {
      setIsPageLoading(true);
      const [zonesData, configData] = await Promise.all([
        readData<SituationZone[]>('situation.json'),
        readData<SystemConfig>('config.json'),
      ]);
      
      setInitialConfig(configData);

      form.reset({
        zones: zonesData.map(z => ({ 
            id: z.id, 
            name: z.name, 
            freeSpots: z.freeSpots, 
            maxSpots: z.maxSpots,
            status: z.status,
            operatingStatus: z.operatingStatus,
            withStaff: !!z.withStaff,
        })),
      });
      setIsPageLoading(false);
    }
    fetchData();
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    const payload = data.zones.map(z => ({ id: z.id, freeSpots: z.freeSpots, status: z.status, operatingStatus: z.operatingStatus, withStaff: z.withStaff }));
    const result = await updateSituation(payload);

    if (result.success) {
      toast({
        title: 'Actualización completada',
        description: result.message,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: result.message,
      });
    }
  };
  
  const canAccess = user?.roles.includes('Admin') || user?.roles.includes('Gestor Situación') || user?.roles.includes('Operador Situación');
  
  if (isAuthLoading || isPageLoading) {
    return <div>Cargando...</div>;
  }
  
  if (!canAccess) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>No tienes permisos para acceder a esta página.</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Actualizar Situación de Zonas</CardTitle>
          <CardDescription>Modifica el estado y las plazas libres para cada zona de la terminal.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4">
                        <h4 className="font-semibold">{form.getValues(`zones.${index}.name`)}</h4>
                        <div className="grid md:grid-cols-4 gap-6 items-end">
                            <FormField
                                control={form.control}
                                name={`zones.${index}.freeSpots`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>Plazas Libres</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input type="number" {...formField} />
                                            </FormControl>
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                / {form.getValues(`zones.${index}.maxSpots`)}
                                            </span>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`zones.${index}.status`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>Estado de la Zona</FormLabel>
                                        <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                            </FormControl>
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
                                name={`zones.${index}.operatingStatus`}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>Estado Operativo</FormLabel>
                                        <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                            </FormControl>
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
                                name={`zones.${index}.withStaff`}
                                render={({ field: formField }) => (
                                    <FormItem className="flex flex-row items-end space-x-3 space-y-0 rounded-md border p-3 h-10">
                                        <FormControl>
                                            <Checkbox
                                                checked={formField.value}
                                                onCheckedChange={formField.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Con Personal</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                ))}
              </div>
              
              {form.formState.errors.zones && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error de validación</AlertTitle>
                    <AlertDescription>{form.formState.errors.zones.message || 'Error en los datos de las zonas.'}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Separator />

      {initialConfig && user?.roles.includes('Admin') && (
        <InstructionsEditor initialInstructions={initialConfig.situationInstructions || ''} />
      )}
    </div>
  );
}
