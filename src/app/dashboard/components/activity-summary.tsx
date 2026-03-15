'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, UserPlus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { CauRequest, PedestrianAccessRequest } from '@/lib/types';

interface ActivitySummaryProps {
  cauRequests: CauRequest[];
  accessRequests: PedestrianAccessRequest[];
}

export default function ActivitySummary({ cauRequests, accessRequests }: ActivitySummaryProps) {
  // Combine and sort activities by date
  const activities = [
    ...cauRequests.map(r => ({
      id: r.id,
      type: 'CAU',
      title: r.subject,
      status: r.status,
      date: parseISO(r.createdAt),
      href: `/cau`
    })),
    ...accessRequests.map(r => ({
      id: r.id,
      type: 'ACCESO',
      title: `${r.fullName} - ${r.documentNumber}`,
      status: 'Generado',
      date: parseISO(r.createdAt),
      href: `/access-requests`
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Resumen de Actividad</CardTitle>
        <CardDescription>Últimas acciones realizadas por tu empresa.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay actividad reciente.</p>
          ) : (
            activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 rounded-full p-2 ${activity.type === 'CAU' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {activity.type === 'CAU' ? <MessageSquare className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium line-clamp-1">{activity.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(activity.date, { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="text-[10px] uppercase">
                    {activity.status}
                  </Badge>
                  <Link href={activity.href}>
                    <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
