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
import DatabaseSettings from './components/database-settings';
import HeroSettings from './components/hero-settings';

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  if (isLoading || !config) {
    return <div>Cargando ajustes del sistema...</div>;
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes del Sistema</h1>
        <p className="text-muted-foreground">Configura los formularios, categorías y conexiones del sistema.</p>
      </div>
      <HeroSettings initialConfig={config} images={images} onUpdate={fetchData} />
      <Separator />
      <DatabaseSettings initialConfig={config} />
      <Separator />
      <ApiSettings initialConfig={config} />
      <Separator />
      <EmailSettings initialConfig={config} />
      <Separator />
      <CompaniesEditor initialCompanies={companies} onUpdate={fetchData} />
      <Separator />
      <CategoriesEditor initialCategories={categories} />
      <Separator />
      <RequestTypesEditor initialRequestTypes={requestTypes} categories={categories} />
      <Separator />
      <PredefinedResponsesEditor initialResponses={predefinedResponses} />
      <Separator />
      <WidgetsEditor initialWidgets={widgets} />
    </div>
  );
}
