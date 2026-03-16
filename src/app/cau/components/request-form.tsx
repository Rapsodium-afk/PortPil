'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, Users, Clock, History } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FileUploadInput from './file-upload-input';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { CauCategory, CauRequest, CauRequestType, User, CustomField, UtiDetails, UserRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { add, formatDuration, intervalToDuration } from 'date-fns';
import { UtiField } from './uti-field';

const baseSchema = z.object({
  type: z.string().min(1, { message: 'Debes seleccionar un tipo de solicitud.' }),
  message: z.string().min(10, { message: 'El mensaje debe tener al menos 10 caracteres.' }),
  userId: z.string().optional(),
});

type RequestFormValues = z.infer<typeof baseSchema> & Record<string, any>;

interface RequestFormProps {
  onNewRequest: (request: CauRequest) => void;
  requestTypes: CauRequestType[];
  categories: CauCategory[];
  transportistaUsers: User[];
  averageResponseTimes: Record<string, number>;
}

export default function RequestForm({ onNewRequest, requestTypes, categories, transportistaUsers, averageResponseTimes }: RequestFormProps) {
  const { user, users } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<CauRequestType | null>(null);
  const [isUtiValid, setIsUtiValid] = useState(false);
  const [utiDetails, setUtiDetails] = useState<UtiDetails | null>(null);

  const canCreateOnBehalf = user?.roles.includes('Admin') || user?.roles.includes('Soporte');

  const dynamicSchema = useMemo(() => {
    if (!selectedRequestType) return baseSchema;

    const customFieldsSchema = (selectedRequestType.customFields || []).reduce((schema, field) => {
        let fieldSchema: z.ZodTypeAny;
        if (field.type === 'text') {
            let stringSchema = z.string();

            if (field.maxLength) {
                stringSchema = stringSchema.max(field.maxLength, `${field.name} no puede exceder los ${field.maxLength} caracteres.`);
            }

             if (field.required) {
                fieldSchema = stringSchema.min(1, `${field.name} es requerido.`);
            } else {
                fieldSchema = stringSchema.optional().default('');
            }
        } else if (field.type === 'file') {
            let fileSchema = z.array(z.instanceof(File));
             if (field.required) {
                fieldSchema = fileSchema.min(1, `Debe adjuntar al menos un archivo para ${field.name}.`);
            } else {
                fieldSchema = fileSchema.optional().default([]);
            }
        } else {
            fieldSchema = z.any();
        }
        return schema.extend({ [field.id]: fieldSchema });
    }, z.object({}));

    const utiSchema = selectedRequestType.requiresUti 
      ? z.object({ uti: z.string().min(1, 'La matrícula UTI es requerida.') })
      : z.object({ uti: z.string().optional().default('') });
      
    const genericFileSchema = selectedRequestType.requiresFile
      ? z.object({ attachments: z.array(z.instanceof(File)).min(1, 'Debe adjuntar al menos un archivo.') })
      : z.object({ attachments: z.array(z.instanceof(File)).optional().default([]) });

    return baseSchema.merge(utiSchema).merge(genericFileSchema).merge(customFieldsSchema);
  }, [selectedRequestType]);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      type: '',
      message: '',
      uti: '',
      attachments: [],
      userId: canCreateOnBehalf ? '' : user?.id,
    },
  });
  
  useEffect(() => {
    const defaultCustomValues = selectedRequestType?.customFields?.reduce((acc, field) => {
        acc[field.id] = field.type === 'file' ? [] : '';
        return acc;
    }, {} as Record<string, any>) || {};

    form.reset({
        type: selectedRequestType?.id || '',
        message: '',
        uti: '',
        attachments: [],
        userId: canCreateOnBehalf ? '' : user?.id,
        ...defaultCustomValues
    });
    // When the form type changes, reset the UTI validation status
    setIsUtiValid(!selectedRequestType?.requiresUti);
    setUtiDetails(null);
  }, [selectedRequestType, form, canCreateOnBehalf, user?.id]);

  const onSubmit = (data: RequestFormValues) => {
    setIsLoading(true);
    
    if (!selectedRequestType) {
        setIsLoading(false);
        return;
    }
    
    const targetUserId = canCreateOnBehalf ? data.userId : user?.id;
    if (!targetUserId) {
        toast({ title: "Error", description: "No se pudo determinar el usuario.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser || !user) {
        toast({ title: "Error", description: "Usuario no válido.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
    
    const customFieldsData: Record<string, any> = {};
    const customFieldAttachments: { name: string; url: string }[] = [];

    selectedRequestType.customFields?.forEach(field => {
      if (data[field.id]) {
        if (field.type === 'file' && Array.isArray(data[field.id])) {
          (data[field.id] as File[]).forEach(file => {
            // In a real app, you'd upload the file and get a URL
            customFieldAttachments.push({ name: file.name, url: '#' });
          });
        } else {
          customFieldsData[field.id] = data[field.id];
        }
      }
    });

    const allAttachments = [
        ...(data.attachments?.map((f: File) => ({ name: f.name, url: '#' })) || []),
        ...customFieldAttachments
    ];

    const now = new Date();
    const slaExpiresAt = selectedRequestType.estimatedResponseTime 
      ? add(now, { hours: selectedRequestType.estimatedResponseTime }).toISOString()
      : undefined;

    let initialMessage = data.message;
    if (utiDetails) {
        const detailsText = `
---
**Información de la Matrícula Validada**
- **Matrícula:** ${utiDetails.plate}
- **Empresa:** ${utiDetails.companyName || 'No disponible'}
- **Fecha Entrada:** ${utiDetails.entranceDate}
- **Estado:** ${utiDetails.state}
- **Ubicación:** ${utiDetails.zone}
- **Duración en terminal:** ${utiDetails.duration}
---
        `;
        initialMessage = `${data.message}\n${detailsText}`;
    }

    const newRequest: CauRequest = {
        id: `cau-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subject: selectedRequestType.title,
        userId: targetUser.id,
        userName: targetUser.name,
        companyId: targetUser.companyIds[0] || '', // Use the first company ID
        createdAt: now.toISOString(),
        status: 'Pendiente',
        category: selectedRequestType.category,
        type: selectedRequestType.title,
        uti: data.uti,
        attachments: allAttachments,
        customFieldsData: customFieldsData,
        history: [{
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            author: user.name,
            authorRole: user.roles[0] as UserRole, // Use primary role
            content: initialMessage,
            createdAt: now.toISOString(),
        }],
        slaExpiresAt,
    };
    
    setTimeout(() => {
        onNewRequest(newRequest);
        toast({
            title: "Solicitud enviada",
            description: "La solicitud ha sido registrada y aparecerá en la bandeja de entrada.",
        });
        form.reset();
        form.setValue('userId', canCreateOnBehalf ? '' : user?.id);
        setSelectedRequestType(null);
        setIsLoading(false);
    }, 1000);
  };

  const handleTypeSelection = (type: CauRequestType) => {
    setSelectedRequestType(type);
    form.setValue('type', type.id);
  }
  
  const handleUtiValidation = (isValid: boolean, details: UtiDetails | null) => {
    setIsUtiValid(isValid);
    setUtiDetails(details);
  }
  
  const filteredRequestTypes = useMemo(() => {
    if (!user?.roles) return [];
    return requestTypes.filter(type => {
        if (!type.allowedRoles || type.allowedRoles.length === 0) {
            return true;
        }
        return user.roles.some(userRole => type.allowedRoles!.includes(userRole));
    });
  }, [requestTypes, user]);

  const groupedRequestTypes = useMemo(() => {
    const groups: Record<string, CauRequestType[]> = {};
    
    // Initialize groups with all known categories to ensure they show up even if empty
    categories.forEach(cat => {
        groups[cat.name] = [];
    });

    filteredRequestTypes.forEach(type => {
        if (!groups[type.category]) {
            groups[type.category] = [];
        }
        groups[type.category].push(type);
    });
    return groups;
  }, [filteredRequestTypes, categories]);

  const categoryNames = categories.map(c => c.name);
  
  const renderField = (fieldConfig: CustomField) => {
     const fieldName = fieldConfig.id;
     const label = `${fieldConfig.name}${fieldConfig.required ? ' *' : ''}`;
     
     if (fieldConfig.type === 'text') {
         return (
            <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
         )
     }
     if (fieldConfig.type === 'file') {
         return (
            <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                            <FileUploadInput 
                                value={field.value || []}
                                onValueChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
         )
     }
     return null;
  }
  
    const formatMinutes = (minutes: number) => {
    if (minutes < 1) return "< 1 minuto";
    const duration = intervalToDuration({ start: 0, end: minutes * 60 * 1000 });
    return formatDuration(duration, { format: ['days', 'hours', 'minutes'] });
  };


  if (selectedRequestType) {
    const averageTime = averageResponseTimes[selectedRequestType.id];
    const isSubmitDisabled = isLoading || (selectedRequestType.requiresUti && !isUtiValid);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{selectedRequestType.title}</CardTitle>
                <CardDescription>{selectedRequestType.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4 mb-6 text-sm">
                    {selectedRequestType.estimatedResponseTime && (
                        <div className="flex items-center p-2 border rounded-md bg-secondary/50">
                            <Clock className="mr-2 h-5 w-5 text-primary"/>
                            <div>
                                <p className="font-semibold">Tiempo máximo de respuesta</p>
                                <p className="text-muted-foreground">{selectedRequestType.estimatedResponseTime} horas</p>
                            </div>
                        </div>
                    )}
                    {averageTime !== undefined && (
                         <div className="flex items-center p-2 border rounded-md bg-secondary/50">
                            <History className="mr-2 h-5 w-5 text-primary"/>
                             <div>
                                <p className="font-semibold">Tiempo de respuesta habitual</p>
                                <p className="text-muted-foreground">~ {formatMinutes(averageTime)}</p>
                            </div>
                        </div>
                    )}
                </div>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {canCreateOnBehalf && (
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4"/>Crear en nombre de</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar un usuario..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {transportistaUsers.map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.name} ({u.roles.join(', ')})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {selectedRequestType.requiresUti && (
                         <FormField
                            control={form.control}
                            name="uti"
                            render={({ field }) => (
                                <UtiField 
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onValidationResult={handleUtiValidation}
                                />
                            )}
                        />
                    )}
                    
                    {selectedRequestType.customFields?.map(renderField)}
                    
                    <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Mensaje <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Describe tu solicitud o problema en detalle..."
                                rows={5}
                                {...field}
                                value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedRequestType.requiresFile && (
                        <FormField
                            control={form.control}
                            name="attachments"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Archivos Adjuntos Genéricos <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <FileUploadInput 
                                            value={field.value || []}
                                            onValueChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <div className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => setSelectedRequestType(null)}>Atrás</Button>
                        <Button type="submit" disabled={isSubmitDisabled}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Enviar Solicitud
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Nueva Solicitud</CardTitle>
        <CardDescription>Selecciona el tipo de solicitud que deseas realizar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={categoryNames}>
            {Object.entries(groupedRequestTypes).map(([category, types]) => (
                <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="text-lg font-semibold">{category}</AccordionTrigger>
                    <AccordionContent className="p-2">
                        <div className="grid gap-2">
                        {types.map(type => (
                            <Button key={type.id} variant="ghost" className="justify-start h-auto text-left whitespace-normal" onClick={() => handleTypeSelection(type)}>
                                <div>
                                    <p className="font-semibold">{type.title}</p>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                            </Button>
                        ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
