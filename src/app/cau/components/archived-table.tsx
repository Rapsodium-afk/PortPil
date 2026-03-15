'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Calendar as CalendarIcon, Filter, Lock } from 'lucide-react';
import type { CauRequest } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ArchivedTableProps {
  initialRequests: CauRequest[];
  onUpdateRequests: (requests: CauRequest[]) => void;
}

export default function ArchivedTable({ initialRequests, onUpdateRequests }: ArchivedTableProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CauRequest[]>(initialRequests);
  const [date, setDate] = React.useState<DateRange | undefined>();

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);
  
  const canManage = user?.roles.includes('Admin') || user?.roles.includes('Soporte') || user?.roles.includes('Soporte');
  
  const archivedRequests = requests
    .filter(r => r.status === 'Archivada')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayedRequests = canManage ? archivedRequests.slice(0, 50) : [];
  
  if (!canManage) {
    return (
        <Card>
            <CardContent className="p-8">
                <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Acceso Restringido</AlertTitle>
                    <AlertDescription>
                        No tienes permisos para ver las solicitudes archivadas.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Solicitudes Archivadas</CardTitle>
            <CardDescription>
              Mostrando las últimas {displayedRequests.length} solicitudes archivadas.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className="w-[300px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Seleccionar rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asunto</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden md:table-cell">Usuario</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha Creación</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.subject}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={request.category === 'Aduaneras' ? 'secondary' : 'outline'}>{request.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{request.userName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </TableCell>
                   <TableCell>{request.uti || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {displayedRequests.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    No se encontraron solicitudes archivadas.
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}
