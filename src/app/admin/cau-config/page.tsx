'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { readData, writeData } from '@/lib/actions';
import { CauCategory, CauRequestType, CauPredefinedResponse } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryManagement from './components/category-management';
import RequestTypeManagement from './components/request-type-management';
import PredefinedResponseManagement from './components/predefined-response-management';
import { MessageSquare, Tags, FileEdit, Zap } from 'lucide-react';

export default function CauConfigPage() {
  const [categories, setCategories] = useState<CauCategory[]>([]);
  const [requestTypes, setRequestTypes] = useState<CauRequestType[]>([]);
  const [predefinedResponses, setPredefinedResponses] = useState<CauPredefinedResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cats, types, resps] = await Promise.all([
      readData<CauCategory[]>('cau-request-categories.json'),
      readData<CauRequestType[]>('cau-request-types.json'),
      readData<CauPredefinedResponse[]>('cau-predefined-responses.json'),
    ]);
    setCategories(cats || []);
    setRequestTypes(types || []);
    setPredefinedResponses(resps || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-8">Cargando configuración CAU...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración CAU</h1>
        <p className="text-muted-foreground">Administra las categorías, tipos de solicitud y respuestas rápidas del Centro de Atención al Usuario.</p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Categorías
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <FileEdit className="h-4 w-4" />
            Tipos de Solicitud
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Respuestas Rápidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoryManagement 
            categories={categories} 
            onCategoriesChange={(newCats: CauCategory[]) => {
              setCategories(newCats);
              writeData('cau-request-categories.json', newCats);
            }} 
          />
        </TabsContent>

        <TabsContent value="types">
          <RequestTypeManagement 
            requestTypes={requestTypes}
            categories={categories}
            onRequestTypesChange={(newTypes: CauRequestType[]) => {
              setRequestTypes(newTypes);
              writeData('cau-request-types.json', newTypes);
            }}
          />
        </TabsContent>

        <TabsContent value="responses">
          <PredefinedResponseManagement 
            responses={predefinedResponses}
            onResponsesChange={(newResps: CauPredefinedResponse[]) => {
              setPredefinedResponses(newResps);
              writeData('cau-predefined-responses.json', newResps);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
