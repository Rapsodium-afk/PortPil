'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CauCategory, CauRequest, CauRequestType, User } from '@/lib/types';
import RequestForm from './components/request-form';
import InboxTable from './components/inbox-table';
import { useAuth } from '@/hooks/use-auth';
import { readData, writeData } from '@/lib/actions';
import ArchivedTable from './components/archived-table';
import { differenceInMinutes } from 'date-fns';
import { Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function CauPage() {
  const [requests, setRequests] = useState<CauRequest[]>([]);
  const [requestTypes, setRequestTypes] = useState<CauRequestType[]>([]);
  const [categories, setCategories] = useState<CauCategory[]>([]);
  const [activeTab, setActiveTab] = useState('new-request');
  const { user, users, isLoading: isAuthLoading } = useAuth();
  
  useEffect(() => {
    async function fetchData() {
        const [requestsData, requestTypesData, categoriesData] = await Promise.all([
            readData<CauRequest[]>('cau-requests.json'),
            readData<CauRequestType[]>('cau-request-types.json'),
            readData<CauCategory[]>('cau-request-categories.json')
        ]);
        setRequests(requestsData);
        setRequestTypes(requestTypesData);
        setCategories(categoriesData);
    }
    if (!isAuthLoading) {
        fetchData();
    }
  }, [isAuthLoading]);

  const transportistaUsers = useMemo(() => 
    users.filter(u => u.roles.some(r => ['Operador Logístico', 'Transitario', 'Agente de Aduanas'].includes(r)))
  , [users]);

  const handleNewRequest = async (newRequest: CauRequest) => {
    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    await writeData('cau-requests.json', updatedRequests);
    
    if (canManage) {
      setActiveTab('inbox');
    } else {
        alert('Tu solicitud ha sido enviada. Recibirás una notificación por correo con las actualizaciones.');
    }
  };

  const handleUpdateRequests = async (updatedRequests: CauRequest[]) => {
    setRequests(updatedRequests);
    await writeData('cau-requests.json', updatedRequests);
  }

  const averageResponseTimes = useMemo(() => {
    const responseTimes: Record<string, number[]> = {};

    requests.forEach(req => {
      const reqType = requestTypes.find(rt => rt.title === req.type);
      if (!reqType) return;
      
      const firstAgentResponse = req.history.find(
        msg => msg.authorRole === 'Admin' || msg.authorRole === 'Soporte Aduanas' || msg.authorRole === 'Soporte Operativo'
      );

      if (firstAgentResponse) {
        const creationTime = new Date(req.createdAt);
        const responseTime = new Date(firstAgentResponse.createdAt);
        const duration = differenceInMinutes(responseTime, creationTime);

        if (!responseTimes[reqType.id]) {
          responseTimes[reqType.id] = [];
        }
        responseTimes[reqType.id].push(duration);
      }
    });

    const averages: Record<string, number> = {};
    for (const typeId in responseTimes) {
      const times = responseTimes[typeId];
      const sum = times.reduce((a, b) => a + b, 0);
      averages[typeId] = sum / times.length;
    }
    
    return averages;
  }, [requests, requestTypes]);

  if (isAuthLoading) {
    return <div>Cargando...</div>;
  }

  const canManage = user?.roles.includes('Admin') || user?.roles.includes('Soporte Operativo') || user?.roles.includes('Soporte Aduanas');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centro de Atención al Usuario (CAU)</h1>
        <p className="text-muted-foreground">Gestione sus solicitudes y documentación de forma centralizada.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn("grid w-full", canManage ? "grid-cols-3 md:w-[600px]" : "grid-cols-1 md:w-[200px]")}>
          <TabsTrigger value="new-request">Nueva Solicitud</TabsTrigger>
          {canManage && <TabsTrigger value="inbox">Bandeja de Entrada</TabsTrigger>}
          {canManage && <TabsTrigger value="archived">Archivadas</TabsTrigger>}
        </TabsList>
        <TabsContent value="new-request">
          <RequestForm 
            onNewRequest={handleNewRequest}
            requestTypes={requestTypes}
            categories={categories}
            transportistaUsers={transportistaUsers}
            averageResponseTimes={averageResponseTimes}
          />
        </TabsContent>
        {canManage ? (
            <>
                <TabsContent value="inbox">
                    <InboxTable 
                        initialRequests={requests} 
                        onUpdateRequests={handleUpdateRequests} 
                        categories={categories}
                    />
                </TabsContent>
                <TabsContent value="archived">
                    <ArchivedTable
                        initialRequests={requests} 
                        onUpdateRequests={handleUpdateRequests} 
                    />
                </TabsContent>
            </>
        ) : (
            <TabsContent value="inbox">
                <Card>
                    <CardContent className="p-8">
                        <Alert>
                            <Lock className="h-4 w-4" />
                            <AlertTitle>Acceso Restringido</AlertTitle>
                            <AlertDescription>
                                No tienes permisos para ver la bandeja de entrada de solicitudes.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
