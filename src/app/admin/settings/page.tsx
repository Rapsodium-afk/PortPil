'use client';

import { useState, useEffect, useCallback } from 'react';
import { readData, writeData } from "@/lib/actions";
import type { CauCategory, CauRequestType, SystemConfig, CauPredefinedResponse, Widget, Company, ImagePlaceholder } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import ApiSettings from "./components/api-settings";
import WidgetsEditor from "./components/widgets-editor";
import CompaniesEditor from "./components/companies-editor";
import EmailSettings from "./components/email-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DatabaseSettings from './components/database-settings';
import HeroSettings from './components/hero-settings';
import CssEditor from './components/css-editor';
import EmailTemplateEditor from './components/email-templates-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [images, setImages] = useState<ImagePlaceholder[]>([]);
  const [templates, setTemplates] = useState<import('@/lib/types').EmailTemplate[]>([]);
  const [storagePaths, setStoragePaths] = useState<NonNullable<SystemConfig['storagePaths']>>({
    documents: '',
    images: '',
    backups: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [
      configData,
      widgetsData,
      companiesData,
      imagesData,
      templatesData,
    ] = await Promise.all([
      readData<SystemConfig>('config.json'),
      readData<Widget[]>('widgets.json'),
      readData<Company[]>('companies.json'),
      readData<{ placeholderImages: ImagePlaceholder[] }>('placeholder-images.json'),
      readData<import('@/lib/types').EmailTemplate[]>('email-templates.json'),
    ]);
    
    const safeConfig: SystemConfig = Array.isArray(configData) ? {} as SystemConfig : configData;
    const safeImages: ImagePlaceholder[] = (imagesData as any)?.placeholderImages || [];

    setConfig(safeConfig);
    setWidgets(widgetsData || []);
    setCompanies(companiesData || []);
    setImages(safeImages);
    setTemplates(Array.isArray(templatesData) ? templatesData : []);
    if (safeConfig.storagePaths) {
      setStoragePaths(safeConfig.storagePaths);
    }
    setIsLoading(false);
  }, []);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdatePortalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    
    const updatedConfig = { ...config, storagePaths };
    await writeData('config.json', updatedConfig);
    setConfig(updatedConfig);
    toast({
      title: "Identidad del portal actualizada",
      description: "El nombre y descripción del portal se han guardado."
    });
  };
  
  if (isLoading || !config) {
    return <div className="p-8">Cargando ajustes del sistema...</div>;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h1>
        <p className="text-muted-foreground">Configura los formularios, categorías y conexiones del sistema.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidad del Portal</CardTitle>
              <CardDescription>Personaliza el nombre y la descripción principal de la aplicación.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePortalInfo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portalName">Nombre del Portal</Label>
                  <Input 
                    id="portalName" 
                    value={config.portalName || ''} 
                    onChange={(e) => setConfig({...config, portalName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portalDescription">Descripción</Label>
                  <Input 
                    id="portalDescription" 
                    value={config.portalDescription || ''} 
                    onChange={(e) => setConfig({...config, portalDescription: e.target.value})}
                  />
                </div>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Guardar Identidad
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <HeroSettings initialConfig={config} images={images} onUpdate={fetchData} />
          <Separator />
          <WidgetsEditor initialWidgets={widgets} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <EmailTemplateEditor templates={templates} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <DatabaseSettings initialConfig={config} />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <CssEditor />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rutas de Almacenamiento</CardTitle>
              <CardDescription>Configura los directorios donde se guardan los archivos físicos en el servidor.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="path-docs">Documentos y Adjuntos</Label>
                  <Input 
                    id="path-docs" 
                    value={storagePaths.documents} 
                    onChange={(e) => setStoragePaths({...storagePaths, documents: e.target.value})}
                    placeholder="C:\PortPilot\Data\Documents"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="path-imgs">Imágenes y Media</Label>
                  <Input 
                    id="path-imgs" 
                    value={storagePaths.images} 
                    onChange={(e) => setStoragePaths({...storagePaths, images: e.target.value})}
                    placeholder="C:\PortPilot\Data\Images"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="path-backups">Copias de Seguridad</Label>
                  <Input 
                    id="path-backups" 
                    value={storagePaths.backups} 
                    onChange={(e) => setStoragePaths({...storagePaths, backups: e.target.value})}
                    placeholder="C:\PortPilot\Data\Backups"
                  />
                </div>
                <Button onClick={handleUpdatePortalInfo} className="mt-4">
                  <Save className="mr-2 h-4 w-4" /> Guardar Rutas
                </Button>
              </div>
            </CardContent>
          </Card>
          <Separator />
          <ApiSettings initialConfig={config} />
          <Separator />
          <EmailSettings initialConfig={config} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
