'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NewsFeed from './components/news-feed';
import SituationCard from './components/situation-card';
import type { CauRequest, NewsPost, SituationZone } from '@/lib/types';
import { readData, writeData } from '@/lib/actions';
import { useAuth } from '@/hooks/use-auth';
import AgentPerformanceStats from './components/agent-performance-stats';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [situation, setSituation] = useState<SituationZone[]>([]);
  const [requests, setRequests] = useState<CauRequest[]>([]);
  const { user, users, isLoading: isAuthLoading } = useAuth();

  const fetchData = useCallback(async () => {
    const [newsData, situationData, requestsData] = await Promise.all([
      readData<NewsPost[]>('news.json'),
      readData<SituationZone[]>('situation.json'),
      readData<CauRequest[]>('cau-requests.json'),
    ]);
    setNews(newsData);
    setSituation(situationData);
    setRequests(requestsData);
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
        <div className="lg:col-span-2">
            <NewsFeed initialNews={news} onNewsChange={handleNewsChange} />
        </div>
        {canViewStats && (
            <AgentPerformanceStats requests={requests} agents={agentUsers} />
        )}
      </div>

    </div>
  );
}
