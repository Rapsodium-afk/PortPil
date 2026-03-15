'use client';

import React, { useEffect, useState } from 'react';
import { getAgentPerformanceMetrics, AgentMetric } from './actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle2, BarChart3, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<AgentMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAgentPerformanceMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalManagements = metrics.reduce((acc, curr) => acc + curr.totalManagements, 0);
  const avgResponseTime = metrics.length > 0
    ? metrics.reduce((acc, curr) => acc + curr.avgResponseTimeHours, 0) / metrics.length
    : 0;
  const avgResolutionTime = metrics.length > 0
    ? metrics.reduce((acc, curr) => acc + curr.avgResolutionTimeHours, 0) / metrics.length
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Rendimiento de Agentes</h1>
        <p className="text-muted-foreground">
          Análisis de tiempos de respuesta y productividad del equipo de soporte.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestiones Totales</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalManagements}</div>
            <p className="text-xs text-muted-foreground">Tickets atendidos por agentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Respuesta Medio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Desde creación hasta primer mensaje de agente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Resolución Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Desde creación hasta cierre del ticket</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Métricas por Agente
          </CardTitle>
          <CardDescription>
            Detalle individual del desempeño de cada miembro del equipo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Gestiones</TableHead>
                <TableHead className="text-right">T. Resp. Medio</TableHead>
                <TableHead className="text-right">T. Resol. Medio</TableHead>
                <TableHead>Productividad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((agent) => (
                <TableRow key={agent.agentName}>
                  <TableCell className="font-medium">{agent.agentName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.agentRole}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{agent.totalManagements}</TableCell>
                  <TableCell className="text-right">{agent.avgResponseTimeHours.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">{agent.avgResolutionTimeHours.toFixed(1)}h</TableCell>
                  <TableCell className="min-w-[150px]">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div 
                                className="h-full bg-primary" 
                                style={{ 
                                    width: `${Math.min((agent.totalManagements / (totalManagements || 1)) * 100 * 2, 100)}%` 
                                }} 
                            />
                        </div>
                        <span className="text-xs font-medium">
                            {((agent.totalManagements / (totalManagements || 1)) * 100).toFixed(0)}%
                        </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {metrics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay datos de rendimiento disponibles aún.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
