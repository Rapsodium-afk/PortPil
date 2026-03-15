'use server';

import { readData } from '@/lib/actions';
import { CauRequest, User } from '@/lib/types';

export interface AgentMetric {
  agentName: string;
  agentRole: string;
  totalManagements: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
}

export async function getAgentPerformanceMetrics() {
  const requests = await readData<CauRequest[]>('cau-requests.json');
  const users = await readData<User[]>('users.json');

  const agentMetrics: Record<string, {
    name: string;
    role: string;
    managements: Set<string>;
    responseTimes: number[];
    resolutionTimes: number[];
  }> = {};

  // Initialize metrics for agents (Admin and Soporte roles)
  users.forEach(user => {
    const isAgent = user.roles.some(r => ['Admin', 'Soporte', 'Agente de Aduanas'].includes(r));
    if (isAgent) {
      agentMetrics[user.name] = {
        name: user.name,
        role: user.roles[0], // Primary role
        managements: new Set(),
        responseTimes: [],
        resolutionTimes: []
      };
    }
  });

  requests.forEach(req => {
    const history = req.history || [];
    const requestCreatedAt = new Date(req.createdAt).getTime();

    // 1. Managements and Response Times
    let firstAgentResponseFound = false;

    history.forEach(msg => {
      const isAgentRole = ['Admin', 'Soporte', 'Agente de Soporte Aduanas'].includes(msg.authorRole);
      
      if (isAgentRole) {
        if (!agentMetrics[msg.author]) {
          agentMetrics[msg.author] = {
            name: msg.author,
            role: msg.authorRole,
            managements: new Set(),
            responseTimes: [],
            resolutionTimes: []
          };
        }
        
        agentMetrics[msg.author].managements.add(req.id);

        // First response time calculation
        if (!firstAgentResponseFound && msg.authorRole !== 'Sistema' && msg.authorRole !== 'Usuario' && msg.authorRole !== 'Transitario' && msg.authorRole !== 'Operador Logístico') {
          const responseTime = new Date(msg.createdAt).getTime() - requestCreatedAt;
          agentMetrics[msg.author].responseTimes.push(responseTime);
          firstAgentResponseFound = true;
        }
      }

      // Resolution Time calculation
      // Look for system messages that indicate a closure by an agent
      if (msg.author === 'Sistema' && msg.content.includes('Estado cambiado a "Cerrada" por')) {
        // Extract agent name from content: 'Estado cambiado a "Cerrada" por Admin.'
        const match = msg.content.match(/por (.*)\.?$/);
        if (match && match[1]) {
          const agentName = match[1].replace(/\.$/, '').trim();
          if (agentMetrics[agentName]) {
            const resolutionTime = new Date(msg.createdAt).getTime() - requestCreatedAt;
            agentMetrics[agentName].resolutionTimes.push(resolutionTime);
          }
        }
      }
    });

    // Handle user closing their own request (we don't credit agents for resolution then)
  });

  const rezult: AgentMetric[] = Object.values(agentMetrics)
    .filter(a => a.managements.size > 0 || a.responseTimes.length > 0 || a.resolutionTimes.length > 0)
    .map(a => ({
      agentName: a.name,
      agentRole: a.role,
      totalManagements: a.managements.size,
      avgResponseTimeHours: a.responseTimes.length > 0 
        ? (a.responseTimes.reduce((acc, curr) => acc + curr, 0) / a.responseTimes.length) / (1000 * 60 * 60)
        : 0,
      avgResolutionTimeHours: a.resolutionTimes.length > 0
        ? (a.resolutionTimes.reduce((acc, curr) => acc + curr, 0) / a.resolutionTimes.length) / (1000 * 60 * 60)
        : 0
    }));

  return rezult;
}
