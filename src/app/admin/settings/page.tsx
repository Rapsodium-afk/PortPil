'use client';

import { useState, useEffect, useCallback } from 'react';
import RequestTypesEditor from "./components/request-types-editor";
import CategoriesEditor from "./components/categories-editor";
import { readData } from "@/lib/actions";
import type { CauCategory, CauRequestType, SystemConfig, CauPredefinedResponse, Widget, Company, ImagePlaceholder } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import ApiSettings from "./components/api-settings";
import PredefinedResponsesEditor from "./components/predefined-responses-editor";
import WidgetsEditor from "./components/widgets-editor";
import CompaniesEditor from "./components/companies-editor";
import EmailSettings from "./components/email-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DatabaseSettings from './components/database-settings';
import HeroSettings from './components/hero-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { writeData } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const [requestTypes, setRequestTypes] = useState<CauRequestType[]>([]);
  const [categories, setCategories] = useState<CauCategory[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [predefinedResponses, setPredefinedResponses] = useState<CauPredefinedResponse[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [images, setImages] = useState<ImagePlaceholder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [
      requestTypesData,
      categoriesData,
      configData,
      predefinedResponsesData,
      widgetsData,
      companiesData,
      imagesData,
    ] = await Promise.all([
      readData<CauRequestType[]>('cau-request-types.json'),
      readData<CauCategory[]>('cau-request-categories.json'),
      readData<SystemConfig>('config.json'),
      readData<CauPredefinedResponse[]>('cau-predefined-responses.json'),
      readData<Widget[]>('widgets.json'),
      readData<Company[]>('companies.json'),
      readData<{ placeholderImages: ImagePlaceholder[] }>('placeholder-images.json'),
    ]);
    
    const safeConfig: SystemConfig = Array.isArray(configData) ? {} as SystemConfig : configData;
    const safeImages: ImagePlaceholder[] = (imagesData as any)?.placeholderImages || [];

    setRequestTypes(requestTypesData);
    setCategories(categoriesData);
    setConfig(safeConfig);
    setPredefinedResponses(predefinedResponsesData);
    setWidgets(widgetsData);
    setCompanies(companiesData);
    setImages(safeImages);
    setIsLoading(false);
  }, []);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdatePortalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    
    await writeData('config.json', config);
    toast({
      title: "Identidad del portal actualizada",
      description: "El nombre y descripción del portal se han guardado."
    });
  };
  
  if (isLoading || !config) {
    return <div>Cargando ajustes del sistema...</div>;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h1>
        <p className="text-muted-foreground">Configura los formularios, categorías y conexiones del sistema.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
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
          <Separator />
          <CategoriesEditor initialCategories={categories} />
          <Separator />
          <RequestTypesEditor initialRequestTypes={requestTypes} categories={categories} />
          <Separator />
          <PredefinedResponsesEditor initialResponses={predefinedResponses} />
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <DatabaseSettings initialConfig={config} />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <ApiSettings initialConfig={config} />
          <Separator />
          <EmailSettings initialConfig={config} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
