'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PedestrianAccessRequest } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RequestLogProps {
  requests: PedestrianAccessRequest[];
  onShowQr: (request: PedestrianAccessRequest) => void;
}

export function RequestLog({ requests, onShowQr }: RequestLogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardList className="mr-2 h-5 w-5" />
          Registro de Solicitudes
        </CardTitle>
        <CardDescription>
          Histórico de accesos solicitados para conductores a pie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Visita</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>UTI</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay solicitudes registradas
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {(() => {
                      try {
                        const datePart = request.visitDate.split('T')[0];
                        const [year, month, day] = datePart.split('-').map(Number);
                        const dateObj = new Date(year, month - 1, day);
                        return format(dateObj, 'dd MMM yyyy', { locale: es });
                      } catch (e) {
                        return request.visitDate || 'Fecha inválida';
                      }
                    })()}
                  </TableCell>
                  <TableCell className="font-medium">{request.fullName}</TableCell>
                  <TableCell>{request.documentNumber}</TableCell>
                  <TableCell className="font-mono text-xs">{request.uti}</TableCell>
                  <TableCell>{request.companyName}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onShowQr(request)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
