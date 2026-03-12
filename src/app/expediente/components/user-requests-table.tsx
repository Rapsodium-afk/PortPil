'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Paperclip, Download, MessageSquare } from 'lucide-react';
import type { CauRequest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


interface UserRequestsTableProps {
  requests: CauRequest[];
}

export default function UserRequestsTable({ requests }: UserRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<CauRequest | null>(null);

  const getStatusVariant = (status: CauRequest['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Aprobado':
      case 'Respondido':
        return 'default';
      case 'Pendiente':
      case 'Pendiente documentación':
        return 'secondary';
      case 'En curso':
        return 'outline';
      case 'No autorizado':
      case 'Denegado':
        return 'destructive';
      case 'Archivada':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2);
  }

  const sortedRequests = requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare />
            Mis Solicitudes
          </CardTitle>
          <CardDescription>
            Historial de todas las solicitudes que has creado en el CAU.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRequests.length > 0 ? sortedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.subject}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={request.category === 'Aduaneras' ? 'secondary' : 'outline'}>{request.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        No has creado ninguna solicitud todavía.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRequest.subject}</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  <span>Creado: {format(new Date(selectedRequest.createdAt), 'dd MMMM yyyy, HH:mm', { locale: es })}</span>
                  <Badge variant="outline" className="ml-2">{selectedRequest.category}</Badge>
                  <Badge variant={getStatusVariant(selectedRequest.status)} className="ml-2">{selectedRequest.status}</Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-6 space-y-6">
                {/* Conversation History */}
                <div className="space-y-6">
                  {selectedRequest.history.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar>
                        <AvatarImage />
                        <AvatarFallback className={cn(
                            'font-semibold',
                            msg.authorRole === 'Sistema' ? 'bg-slate-300 text-slate-700' :
                            ['Admin', 'Soporte Aduanas', 'Soporte Operativo'].includes(msg.authorRole) ? 'bg-amber-200 text-amber-800' : 
                            'bg-sky-200 text-sky-800'
                        )}>
                          {getInitials(msg.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{msg.author}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), 'dd MMM, HH:mm', { locale: es })}</p>
                        </div>
                        <div className={cn('p-3 rounded-lg mt-1 text-sm whitespace-pre-wrap',
                            msg.authorRole === 'Sistema' ? 'bg-slate-100 italic' : 'bg-muted/50'
                        )}>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attachments */}
                {(selectedRequest.attachments.length > 0 || selectedRequest.uti) && (
                 <div className="space-y-4 pt-4 border-t">
                    {selectedRequest.uti && (
                       <div>
                           <h4 className="font-semibold text-sm mb-1">Matrícula UTI</h4>
                           <p className="text-sm text-muted-foreground">{selectedRequest.uti}</p>
                       </div>
                    )}
                    {selectedRequest.attachments.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 text-sm flex items-center"><Paperclip className="mr-2 h-4 w-4"/>Archivos Adjuntos</h4>
                            <ul className="space-y-2">
                                {selectedRequest.attachments.map(file => (
                                    <li key={file.name} className="flex items-center justify-between rounded-md border p-2">
                                        <span className="text-sm">{file.name}</span>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={file.url} download>
                                                <Download className="mr-2 h-4 w-4"/>
                                                Descargar
                                            </a>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                 </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
