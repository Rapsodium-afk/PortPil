'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { UserPlus } from 'lucide-react';

const formSchema = z.object({
  documentNumber: z.string().min(5, 'Documento inválido'),
  fullName: z.string().min(3, 'Nombre demasiado corto'),
  phoneNumber: z.string().min(9, 'Teléfono inválido'),
  uti: z.string().min(1, 'UTI es requerida'),
  visitDate: z.string().min(1, 'Fecha es requerida'),
});

type FormValues = z.infer<typeof formSchema>;

interface RequestFormProps {
  onSubmit: (values: FormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function RequestForm({ onSubmit, isSubmitting }: RequestFormProps) {
  const { activeCompany } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentNumber: '',
      fullName: '',
      phoneNumber: '',
      uti: '',
      visitDate: new Date().toISOString().split('T')[0],
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Nueva Solicitud de Acceso
        </CardTitle>
        <CardDescription>
          Solicita el acceso para un conductor a pie para la empresa {activeCompany?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI / NIE / Pasaporte</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678Z" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+34 600 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uti"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UTI a visitar (Tractora o Remolque)</FormLabel>
                    <FormControl>
                      <Input placeholder="1234ABC / R-1234-BBB" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día de la visita</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Generar Solicitud'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
