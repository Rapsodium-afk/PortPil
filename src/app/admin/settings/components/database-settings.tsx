'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Database, Save, TestTube, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import type { SystemConfig, DatabaseConfig, ModulePersistence } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { writeData, readData, testConnectionAction, syncDataFromJsonToDbAction, testTraceabilityConnectionAction } from '@/lib/actions';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const dbConfigSchema = z.object({
  dbHost: z.string().optional(),
  dbPort: z.coerce.number().optional(),
  dbUser: z.string().optional(),
  dbPassword: z.string().optional(),
  dbName: z.string().optional(),
});

const dualDbConfigSchema = z.object({
  system: dbConfigSchema,
  traceability: dbConfigSchema,
});

type DualDbConfigFormValues = z.infer<typeof dualDbConfigSchema>;

interface DatabaseSettingsProps {
  initialConfig: SystemConfig;
}

export default function DatabaseSettings({ initialConfig }: DatabaseSettingsProps) {
  const { toast } = useToast();
  const [isTestingSystem, setIsTestingSystem] = React.useState(false);
  const [isTestingTraceability, setIsTestingTraceability] = React.useState(false);

  const form = useForm<DualDbConfigFormValues>({
    resolver: zodResolver(dualDbConfigSchema),
    defaultValues: {
      system: {
        dbHost: initialConfig.dbConfig?.dbHost || 'localhost',
        dbPort: initialConfig.dbConfig?.dbPort || 3306,
        dbUser: initialConfig.dbConfig?.dbUser || '',
        dbPassword: initialConfig.dbConfig?.dbPassword || '',
        dbName: initialConfig.dbConfig?.dbName || '',
      },
      traceability: {
        dbHost: initialConfig.traceabilityDbConfig?.dbHost || 'localhost',
        dbPort: initialConfig.traceabilityDbConfig?.dbPort || 5432,
        dbUser: initialConfig.traceabilityDbConfig?.dbUser || '',
        dbPassword: initialConfig.traceabilityDbConfig?.dbPassword || '',
        dbName: initialConfig.traceabilityDbConfig?.dbName || '',
      },
    },
  });

  const onSave = async (data: DualDbConfigFormValues) => {
    const updatedConfig: SystemConfig = {
      ...initialConfig,
      dbConfig: data.system,
      traceabilityDbConfig: data.traceability,
    };
    await writeData('config.json', updatedConfig);
    toast({
      title: 'Configuraciones de Base de Datos guardadas',
      description: 'Los ajustes de conexión han sido actualizados.',
    });
  };

  const handleTestConnection = async (type: 'system' | 'traceability') => {
    const data = form.getValues()[type];
    const setIsTesting = type === 'system' ? setIsTestingSystem : setIsTestingTraceability;
    
    setIsTesting(true);
    toast({
      title: `Probando conexión ${type}...`,
      description: `Conectando con ${type === 'system' ? 'MariaDB/MySQL' : 'PostgreSQL'}...`,
    });
    
    try {
      if (type === 'system') {
          const result = await testConnectionAction(data);
          if (result.success) {
              toast({ title: 'Conexión exitosa', description: 'Se ha podido establecer conexión con MariaDB.' });
          } else {
              toast({ variant: 'destructive', title: 'Error de conexión MariaDB', description: result.message });
          }
      } else {
          const result = await testTraceabilityConnectionAction(data);
          if (result.success) {
              toast({ title: 'Conexión exitosa', description: 'Se ha podido establecer conexión con PostgreSQL.' });
          } else {
              toast({ variant: 'destructive', title: 'Error de conexión PostgreSQL', description: result.message });
          }
      }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error crítico', description: error.message || 'Error inesperado al probar la conexión.' });
    } finally {
        setIsTesting(false);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Database className="mr-2"/>Ajustes de Base de Datos</CardTitle>
          <CardDescription>
            Configura los parámetros de conexión para el sistema (MariaDB) y la trazabilidad (PostgreSQL).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
              <Tabs defaultValue="system">
                <TabsList className="mb-4">
                  <TabsTrigger value="system">Base de Datos Sistema (MariaDB)</TabsTrigger>
                  <TabsTrigger value="traceability">Base de Datos Trazabilidad (PostgreSQL)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="system" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="system.dbHost"
                      render={({ field }) => (
                        <FormItem><FormLabel>Host</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="system.dbPort"
                      render={({ field }) => (
                        <FormItem><FormLabel>Puerto</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="system.dbUser"
                      render={({ field }) => (
                        <FormItem><FormLabel>Usuario</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="system.dbPassword"
                      render={({ field }) => (
                        <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="system.dbName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Nombre DB</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleTestConnection('system')}
                    disabled={isTestingSystem}
                  >
                    {isTestingSystem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
                    Probar Conexión MariaDB
                  </Button>
                </TabsContent>

                <TabsContent value="traceability" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="traceability.dbHost"
                      render={({ field }) => (
                        <FormItem><FormLabel>Host PostgreSQL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="traceability.dbPort"
                      render={({ field }) => (
                        <FormItem><FormLabel>Puerto PostgreSQL</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="traceability.dbUser"
                      render={({ field }) => (
                        <FormItem><FormLabel>Usuario PostgreSQL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="traceability.dbPassword"
                      render={({ field }) => (
                        <FormItem><FormLabel>Contraseña PostgreSQL</FormLabel><FormControl><Input type="password" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="traceability.dbName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Nombre DB PostgreSQL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleTestConnection('traceability')}
                    disabled={isTestingTraceability}
                  >
                    {isTestingTraceability ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube className="mr-2 h-4 w-4" />}
                    Probar Configuración PostgreSQL
                  </Button>
                </TabsContent>
              </Tabs>

              <Button type="submit" size="lg" className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" /> Guardar Todas las Configuraciones
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Persistencia de Módulos (MariaDB)</CardTitle>
          <CardDescription>Gestión de datos de la aplicación base.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <p className="text-sm text-muted-foreground">Modo: <span className="uppercase">{currentMode}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button size="sm" variant="outline" onClick={() => handleSync(module)} disabled={currentMode !== 'db'}>
                      <RefreshCw className="mr-2 h-3 w-3" /> Sincronizar
                    </Button>
                    <Switch checked={currentMode === 'db'} onCheckedChange={(checked) => togglePersistence(module, checked ? 'db' : 'json')} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
