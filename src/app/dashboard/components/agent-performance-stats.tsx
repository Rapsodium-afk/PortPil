'use client';

import React, { useMemo } from 'react';
import { differenceInMinutes } from 'date-fns';
import { Award, Rabbit, Snail, BarChart, CheckCircle } from 'lucide-react';
import type { AgentStats, CauRequest, User } from '@/lib/types';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AgentPerformanceStatsProps {
  requests: CauRequest[];
  agents: User[];
}

export default function AgentPerformanceStats({ requests, agents }: AgentPerformanceStatsProps) {
  const agentStats: AgentStats[] = useMemo(() => {
    const stats: Record<string, AgentStats> = {};

    agents.forEach(agent => {
      stats[agent.id] = {
        agentId: agent.id,
        agentName: agent.name,
        attendedRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
      };
    });

    requests.forEach(request => {
      const firstAgentResponse = request.history.find(
        msg => msg.authorRole === 'Admin' || msg.authorRole === 'Soporte Aduanas' || msg.authorRole === 'Soporte Operativo'
      );

      if (firstAgentResponse) {
        const respondingAgent = agents.find(a => a.name === firstAgentResponse.author);
        if (respondingAgent && stats[respondingAgent.id]) {
          const requestCreationTime = new Date(request.createdAt);
          const responseTime = new Date(firstAgentResponse.createdAt);
          const responseDuration = differenceInMinutes(responseTime, requestCreationTime);

          stats[respondingAgent.id].attendedRequests += 1;
          stats[respondingAgent.id].totalResponseTime += responseDuration;
        }
      }
    });

    const finalStats = Object.values(stats).map(stat => ({
      ...stat,
      averageResponseTime: stat.attendedRequests > 0 ? stat.totalResponseTime / stat.attendedRequests : 0,
    }));
    
    return finalStats.sort((a,b) => b.attendedRequests - a.attendedRequests);

  }, [requests, agents]);

  const mostActiveAgent = useMemo(() => {
      if (agentStats.length === 0) return null;
      return agentStats.reduce((prev, current) => (prev.attendedRequests > current.attendedRequests ? prev : current));
  }, [agentStats]);

  const fastestAgent = useMemo(() => {
    const respondingAgents = agentStats.filter(a => a.attendedRequests > 0);
    if (respondingAgents.length === 0) return null;
    return respondingAgents.reduce((prev, current) => (prev.averageResponseTime < current.averageResponseTime ? prev : current));
  }, [agentStats]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><BarChart className="mr-2"/>Rendimiento de Agentes</CardTitle>
        <CardDescription>Estadísticas de respuesta del equipo de CAU.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead className="text-center">Atendidas</TableHead>
                <TableHead className="text-center">TMR (min)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentStats.map(stat => (
                <TableRow key={stat.agentId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        {stat.agentName}
                        {stat.agentId === mostActiveAgent?.agentId && (
                             <Tooltip>
                                <TooltipTrigger>
                                    <Award className="h-4 w-4 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent><p>Agente más activo</p></TooltipContent>
                             </Tooltip>
                        )}
                         {stat.agentId === fastestAgent?.agentId && (
                             <Tooltip>
                                <TooltipTrigger>
                                    <Rabbit className="h-4 w-4 text-sky-500" />
                                </TooltipTrigger>
                                <TooltipContent><p>Respuesta más rápida</p></TooltipContent>
                             </Tooltip>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{stat.attendedRequests}</TableCell>
                  <TableCell className="text-center">{stat.averageResponseTime.toFixed(1)}</TableCell>
                </TableRow>
              ))}
              {agentStats.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No hay datos de agentes para mostrar.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
