'use client';

import React, { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CauCategory, CauRequestCategory, CauRequestType, CustomField, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { FilePlus2, FileText, Hash, PlusCircle, Trash2, Type, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

export const customFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  type: z.enum(['text', 'file']),
  required: z.boolean().optional(),
  validationType: z.enum(['text', 'numeric', 'alphanumeric']).optional(),
  maxLength: z.number().optional(),
});

export const requestTypeSchema = z.object({
  title: z.string().min(3, { message: 'El título es requerido.' }),
  description: z.string().min(10, { message: 'La descripción es requerida.' }),
  category: z.string().min(1, 'La categoría es requerida.'),
  requiresUti: z.boolean(),
  requiresFile: z.boolean(),
  customFields: z.array(customFieldSchema),
  estimatedResponseTime: z.number().optional(),
  allowedRoles: z.array(z.string()).optional(),
});

export type RequestTypeFormValues = z.infer<typeof requestTypeSchema>;

interface RequestTypeDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (requestType: CauRequestType) => void;
  requestType: CauRequestType | null;
  categories: CauCategory[];
}

const allRoles: UserRole[] = ['Admin', 'Soporte Operativo', 'Soporte Aduanas', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'];

export function RequestTypeDialog({ isOpen, setIsOpen, onSave, requestType, categories }: RequestTypeDialogProps) {
  const { toast } = useToast();

  const form = useForm<RequestTypeFormValues>({
    resolver: zodResolver(requestTypeSchema),
    defaultValues: {
      title: '',
      description: '',
      category: categories[0]?.name || '',
      requiresUti: false,
      requiresFile: false,
      customFields: [],
      estimatedResponseTime: 24,
      allowedRoles: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      const defaultValues = requestType
        ? {
            title: requestType.title,
            description: requestType.description,
            category: requestType.category,
            requiresUti: requestType.requiresUti,
            requiresFile: requestType.requiresFile,
            customFields: requestType.customFields || [],
            estimatedResponseTime: requestType.estimatedResponseTime || 24,
            allowedRoles: requestType.allowedRoles || [],
          }
        : {
            title: '',
            description: '',
            category: categories[0]?.name || '',
            requiresUti: false,
            requiresFile: false,
            customFields: [],
            estimatedResponseTime: 24,
            allowedRoles: [],
          };
      form.reset(defaultValues);
    }
  }, [isOpen, requestType, categories, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  const onSubmit = (data: RequestTypeFormValues) => {
    const typeToSave: CauRequestType = {
      id: requestType?.id || `req-type-${Date.now()}`,
      ...data,
      category: data.category as CauRequestCategory,
      customFields: data.customFields as CustomField[],
      estimatedResponseTime: data.estimatedResponseTime,
      allowedRoles: data.allowedRoles as UserRole[],
    };

    onSave(typeToSave);
    toast({
      title: requestType ? 'Tipo de Solicitud actualizado' : 'Tipo de Solicitud creado',
      description: `El tipo de solicitud "${data.title}" ha sido guardado correctamente.`,
    });
    setIsOpen(false);
  };
  
  const addTextField = () => {
    append({ id: `field-${Date.now()}`, name: '', type: 'text', required: false, validationType: 'text', maxLength: 50 });
  };
  
  const addFileField = () => {
    append({ id: `field-${Date.now()}`, name: '', type: 'file', required: false });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>{requestType ? 'Editar Tipo de Solicitud' : 'Crear Nuevo Tipo de Solicitud'}</DialogTitle>
          <DialogDescription>
            {requestType ? 'Modifica los detalles y campos del formulario.' : 'Define un nuevo tipo de solicitud para el CAU.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="requiresUti"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                      <div className="space-y-0.5">
                        <FormLabel>Requiere Matrícula UTI</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresFile"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                      <div className="space-y-0.5">
                        <FormLabel>Requiere Adjunto Genérico</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="estimatedResponseTime"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center"><Clock className="mr-2 h-4 w-4" /> Tiempo de Respuesta (horas)</FormLabel>
                      <FormDescription>Define el SLA en horas para este tipo de solicitud.</FormDescription>
                    </div>
                    <FormControl>
                      <Input type="number" className="w-24" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Separator className="my-6" />

              <FormField
                control={form.control}
                name="allowedRoles"
                render={() => (
                    <FormItem>
                    <FormLabel>Roles Permitidos</FormLabel>
                    <FormDescription>
                        Selecciona qué roles pueden ver y crear este tipo de solicitud. 
                        Si no se selecciona ninguno, será visible para todos.
                    </FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-lg border p-2">
                        {allRoles.map((role) => (
                        <FormField
                            key={role}
                            control={form.control}
                            name="allowedRoles"
                            render={({ field }) => {
                            return (
                                <FormItem key={role} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value?.includes(role)}
                                    onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                        ? field.onChange([...currentValue, role])
                                        : field.onChange(currentValue?.filter((value) => value !== role));
                                    }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">{role}</FormLabel>
                                </FormItem>
                            );
                            }}
                        />
                        ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
              
              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-medium mb-2">Campos del Formulario</h3>
                <FormDescription>Define los campos específicos para este tipo de solicitud.</FormDescription>
                <div className="space-y-4 mt-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <FormField
                          control={form.control}
                          name={`customFields.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del Campo</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                            control={form.control}
                            name={`customFields.${index}.required`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <FormLabel>Requerido</FormLabel>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )}
                        />
                        {form.getValues(`customFields.${index}.type`) === 'text' && (
                            <div className="grid grid-cols-2 gap-2 col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`customFields.${index}.validationType`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="text">Texto</SelectItem>
                                                <SelectItem value="alphanumeric">Alfanumérico</SelectItem>
                                                <SelectItem value="numeric">Numérico</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`customFields.${index}.maxLength`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Max. Long</FormLabel>
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {form.getValues(`customFields.${index}.type`) === 'file' && (
                            <div className="text-sm text-muted-foreground p-2 border rounded-md bg-secondary/50 col-span-2 flex items-center h-10">
                                <FileText className="mr-2 h-4 w-4" /> Campo de subida de archivo
                            </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" size="sm" onClick={addTextField}>
                        <Type className="mr-2 h-4 w-4"/> Añadir Campo de Texto
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addFileField}>
                        <FilePlus2 className="mr-2 h-4 w-4"/> Añadir Campo de Archivo
                    </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
