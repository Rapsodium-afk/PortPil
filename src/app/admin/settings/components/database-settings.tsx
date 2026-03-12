'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Database, Save, TestTube } from 'lucide-react';
import type { SystemConfig, DatabaseConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { writeData } from '@/lib/actions';
import { Separator } from '@/components/ui/separator';

const dbConfigSchema = z.object({
  dbHost: z.string().optional(),
  dbPort: z.coerce.number().optional(),
  dbUser: z.string().optional(),
  dbPassword: z.string().optional(),
  dbName: z.string().optional(),
});

type DbConfigFormValues = z.infer<typeof dbConfigSchema>;

interface DatabaseSettingsProps {
  initialConfig: SystemConfig;
}

export default function DatabaseSettings({ initialConfig }: DatabaseSettingsProps) {
  const { toast } = useToast();

  const form = useForm<DbConfigFormValues>({
    resolver: zodResolver(dbConfigSchema),
    defaultValues: {
      dbHost: initialConfig.dbConfig?.dbHost || 'localhost',
      dbPort: initialConfig.dbConfig?.dbPort || 3306,
      dbUser: initialConfig.dbConfig?.dbUser || '',
      dbPassword: initialConfig.dbConfig?.dbPassword || '',
      dbName: initialConfig.dbConfig?.dbName || '',
    },
  });

  const onSave = async (data: DbConfigFormValues) => {
    const updatedConfig: SystemConfig = {
      ...initialConfig,
      dbConfig: data,
    };
    await writeData('config.json', updatedConfig);
    toast({
      title: 'Configuración de Base de Datos guardada',
      description: 'Los ajustes de conexión han sido actualizados en el archivo de configuración.',
    });
  };

  const handleTestConnection = () => {
    // In a real implementation, this would call a server action to test the DB connection.
    console.log('Simulating testing DB connection with:', form.getValues());
    toast({
      title: 'Prueba de Conexión (Simulación)',
      description: `Se intentaría conectar a ${form.getValues('dbHost')}. Revisa la consola para ver los datos.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Database className="mr-2"/>Ajustes de Base de Datos</CardTitle>
        <CardDescription>
          Configura los parámetros de conexión para la base de datos MySQL o MariaDB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dbHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl><Input {...field} placeholder="localhost" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dbPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puerto</FormLabel>
                    <FormControl><Input type="number" {...field} placeholder="3306" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dbUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl><Input {...field} placeholder="root" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dbPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="••••••••" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="dbName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre de la Base de Datos</FormLabel>
                    <FormControl><Input {...field} placeholder="portpilot_db" /></FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Configuración
                </Button>
                <Button type="button" variant="outline" onClick={handleTestConnection}>
                    <TestTube className="mr-2 h-4 w-4" />
                    Probar Conexión (Sim)
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
