'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NewsFeed from './components/news-feed';
import SituationCard from './components/situation-card';
import ActivitySummary from './components/activity-summary';
import type { CauRequest, NewsPost, SituationZone, PedestrianAccessRequest } from '@/lib/types';
import { readData, writeData } from '@/lib/actions';
import { useAuth } from '@/hooks/use-auth';
import AgentPerformanceStats from './components/agent-performance-stats';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [situation, setSituation] = useState<SituationZone[]>([]);
  const [requests, setRequests] = useState<CauRequest[]>([]);
  const [accessRequests, setAccessRequests] = useState<PedestrianAccessRequest[]>([]);
  const { user, users, isLoading: isAuthLoading, activeCompany } = useAuth();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const [newsData, situationData, requestsData, accessData] = await Promise.all([
      readData<NewsPost[]>('news.json'),
      readData<SituationZone[]>('situation.json'),
      readData<CauRequest[]>('cau-requests.json'),
      readData<PedestrianAccessRequest[]>('access-requests.json'),
    ]);
    setNews(newsData || []);
    setSituation(situationData || []);
    setRequests(requestsData || []);
    setAccessRequests(accessData || []);
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
        fetchData();
    }
  }, [isAuthLoading, fetchData]);
  
  const handleNewsChange = async (newNews: NewsPost[]) => {
    setNews(newNews);
    await writeData('news.json', newNews);
  }
  
  const terminalZones = useMemo(() => situation.filter(z => z.category === 'TERMINAL'), [situation]);
  const auxZones = useMemo(() => situation.filter(z => z.category === 'ZONA_AUXILIAR'), [situation]);
  
  const canViewStats = user?.roles.includes('Admin');
  const agentUsers = users.filter(u => u.roles.includes('Admin') || u.roles.includes('Soporte Operativo') || u.roles.includes('Soporte Aduanas'));

  const filteredCauRequests = useMemo(() => {
    if (user?.roles.includes('Admin') || user?.roles.includes('Soporte Operativo')) return requests;
    return requests.filter(r => r.companyId === activeCompany?.id);
  }, [requests, user, activeCompany]);

  const filteredAccessRequests = useMemo(() => {
    if (user?.roles.includes('Admin') || user?.roles.includes('Soporte Operativo')) return accessRequests;
    return accessRequests.filter(r => r.companyId === activeCompany?.id);
  }, [accessRequests, user, activeCompany]);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Situación</h1>
        <p className="text-muted-foreground">Vista general del estado de la terminal en tiempo real.</p>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Terminales</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {terminalZones.map((zone) => (
            <SituationCard key={zone.id} zone={zone} onUpdate={fetchData} />
          ))}
        </div>
      </div>

       <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Zonas Auxiliares</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {auxZones.map((zone) => (
            <SituationCard key={zone.id} zone={zone} onUpdate={fetchData} />
          ))}
        </div>
      </div>
      
      <Separator />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <ActivitySummary cauRequests={filteredCauRequests} accessRequests={filteredAccessRequests} />
            <NewsFeed initialNews={news} onNewsChange={handleNewsChange} allowAdd={false} />
        </div>
        {canViewStats ? (
            <AgentPerformanceStats requests={requests} agents={agentUsers} />
        ) : (
          <div className="space-y-6">
             <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Enlaces Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button variant="outline" className="w-full justify-start h-8 text-xs" onClick={() => router.push('/cau')}>
                    <MessageSquare className="mr-2 h-3 w-3" /> Nueva Solicitud CAU
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-8 text-xs" onClick={() => router.push('/access-requests')}>
                    <UserPlus className="mr-2 h-3 w-3" /> Nuevo Pase Acceso
                  </Button>
                </CardContent>
             </Card>
          </div>
        )}
      </div>

    </div>
  );
}
