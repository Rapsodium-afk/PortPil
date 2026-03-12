'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2, BotMessageSquare } from 'lucide-react';
import type { CauPredefinedResponse, CauRequestStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { writeData } from '@/lib/actions';
import { Badge } from '@/components/ui/badge';

const responseSchema = z.object({
  title: z.string().min(3, 'El título es requerido.'),
  responseText: z.string().min(10, 'El texto de la respuesta es requerido.'),
  status: z.enum(['Aprobado', 'Denegado', 'No autorizado', 'Pendiente documentación', 'En curso', 'Respondido']),
});

type ResponseFormValues = z.infer<typeof responseSchema>;

const allStatuses: CauRequestStatus[] = ['Aprobado', 'Denegado', 'No autorizado', 'Pendiente documentación', 'En curso', 'Respondido'];

interface PredefinedResponsesEditorProps {
  initialResponses: CauPredefinedResponse[];
}

export default function PredefinedResponsesEditor({ initialResponses }: PredefinedResponsesEditorProps) {
  const [responses, setResponses] = useState<CauPredefinedResponse[]>(initialResponses);
  const { toast } = useToast();

  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      title: '',
      responseText: '',
      status: 'Respondido',
    },
  });

  const onSubmit = async (data: ResponseFormValues) => {
    const newResponse: CauPredefinedResponse = {
      id: `resp-${Date.now()}`,
      ...data,
    };
    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    await writeData('cau-predefined-responses.json', updatedResponses);
    toast({
      title: 'Respuesta predefinida creada',
      description: `La respuesta "${newResponse.title}" ha sido guardada.`,
    });
    form.reset();
  };
  
  const handleDelete = async (responseId: string) => {
    const updatedResponses = responses.filter(r => r.id !== responseId);
    setResponses(updatedResponses);
    await writeData('cau-predefined-responses.json', updatedResponses);
    toast({
      title: 'Respuesta predefinida eliminada',
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Añadir Respuesta Predefinida</CardTitle>
          <CardDescription>Crea nuevas plantillas de respuesta para agilizar la comunicación.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título de la Respuesta</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Aprobación Estándar" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="responseText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de la Respuesta</FormLabel>
                    <FormControl><Textarea rows={4} {...field} placeholder="Escribe el texto que se enviará al usuario..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado a Asignar</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Respuesta
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Respuestas Existentes</CardTitle>
          <CardDescription>Gestiona las plantillas de respuesta actuales.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {responses.map(response => (
              <div key={response.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{response.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 italic">"{response.responseText}"</p>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(response.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
                <div className="mt-2">
                    <Badge variant="outline">Estado: {response.status}</Badge>
                </div>
              </div>
            ))}
             {responses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No hay respuestas predefinidas.</p>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
