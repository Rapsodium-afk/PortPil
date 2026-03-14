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
import { writeData, readData, testConnectionAction, syncDataFromJsonToDbAction } from '@/lib/actions';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ModulePersistence } from '@/lib/types';

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

  const handleTestConnection = async () => {
    const data = form.getValues();
    toast({
      title: 'Probando conexión...',
      description: 'Conectando con MariaDB/MySQL...',
    });
    
    const result = await testConnectionAction(data);
    
    if (result.success) {
      toast({
        title: 'Conexión exitosa',
        description: 'Se ha podido establecer conexión con la base de datos.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: result.message,
      });
    }
  };

  const togglePersistence = async (module: string, mode: 'json' | 'db') => {
    const updatedConfig: SystemConfig = {
      ...initialConfig,
      modulePersistence: {
        ...initialConfig.modulePersistence!,
        [module]: mode
      }
    };
    await writeData('config.json', updatedConfig);
    toast({
      title: `Modo ${mode.toUpperCase()} activado`,
      description: `El módulo ${module} ahora utiliza persistencia en ${mode.toUpperCase()}.`
    });
  };

  const handleSync = async (module: string) => {
    toast({
      title: 'Sincronizando...',
      description: `Migrando datos de ${module} (JSON -> DB)...`
    });
    // In actions.ts, we already handled ON DUPLICATE KEY UPDATE in writeToDb.
    // We just need to trigger a read(json) and write(db).
    try {
        await syncDataFromJsonToDbAction(module);
        toast({
          title: 'Sincronización completada',
          description: `Los datos de ${module} han sido migrados a la base de datos.`
        });
    } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error de sincronización',
          description: error.message
        });
    }
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
                    Probar Conexión Real
                </Button>
            </div>
          </form>
        </Form>

        <Separator className="my-8" />

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Migración y Persistencia por Módulo</h3>
            <p className="text-sm text-muted-foreground">
              Activa el uso de la base de datos para cada sección de forma independiente.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Asegúrate de que la conexión sea exitosa antes de activar el modo DB.
              Se recomienda "Sincronizar Datos" inmediatamente después de activar el modo DB para no perder información.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            {(['users', 'news', 'cau', 'occupancy', 'fleet'] as const).map((module) => {
              const currentMode = initialConfig.modulePersistence?.[module] || 'json';
              return (
                <div key={module} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base capitalize">
                      {module === 'cau' ? 'CAU (Tickets)' : 
                       module === 'fleet' ? 'Gestión de Flotas' : 
                       module === 'occupancy' ? 'Ocupación de Plazas' : 
                       module === 'users' ? 'Gestión de Usuarios' : 'Noticias'}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Modo actual: <span className="font-medium uppercase">{currentMode}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleSync(module)}
                      disabled={currentMode !== 'db'}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" /> Sincronizar JSON {"->"} DB
                    </Button>
                    <Switch 
                      checked={currentMode === 'db'}
                      onCheckedChange={(checked) => togglePersistence(module, checked ? 'db' : 'json')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
