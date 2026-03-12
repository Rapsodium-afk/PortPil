'use client';

import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Filter, MoreHorizontal, Paperclip, Download, Send, CornerDownRight, MessageSquare, Archive, FolderSync } from 'lucide-react';
import type { CauMessage, CauRequest, CauRequestStatus, CauCategory, CauRequestCategory, UserRole } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { isBefore, isAfter, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface InboxTableProps {
  initialRequests: CauRequest[];
  onUpdateRequests: (requests: CauRequest[]) => void;
  categories: CauCategory[];
}

export default function InboxTable({ initialRequests, onUpdateRequests, categories }: InboxTableProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CauRequest[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<CauRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);
  
  const handleReply = () => {
    if (!selectedRequest || !user || replyContent.trim() === '') return;

    const newMessage: CauMessage = {
      id: `msg-${Date.now()}`,
      author: user.name,
      authorRole: user.roles[0] as UserRole, // Use the primary role
      content: replyContent,
      createdAt: new Date().toISOString(),
    };

    const updatedRequest: CauRequest = {
      ...selectedRequest,
      history: [...selectedRequest.history, newMessage],
      status: user.roles.includes('Usuario') ? 'Pendiente' : 'Respondido',
    };
    
    const updatedRequests = requests.map(r => r.id === updatedRequest.id ? updatedRequest : r);
    onUpdateRequests(updatedRequests);
    setSelectedRequest(updatedRequest);
    setReplyContent('');
  };
  
  const handleStatusChange = (newStatus: CauRequestStatus) => {
    if (!selectedRequest || !user) return;

    const statusChangeMessage: CauMessage = {
      id: `msg-${Date.now()}`,
      author: 'Sistema',
      authorRole: 'Sistema',
      content: `Estado cambiado a "${newStatus}" por ${user.name}.`,
      createdAt: new Date().toISOString(),
    }
    
    const updatedRequest: CauRequest = { 
      ...selectedRequest, 
      status: newStatus,
      history: [...selectedRequest.history, statusChangeMessage],
    };

    const updatedRequests = requests.map(r => r.id === updatedRequest.id ? updatedRequest : r);
    onUpdateRequests(updatedRequests);
    setSelectedRequest(updatedRequest);
  }
  
  const handleCategoryChange = (newCategory: CauRequestCategory) => {
    if (!selectedRequest || !user) return;

    const categoryChangeMessage: CauMessage = {
      id: `msg-${Date.now()}`,
      author: 'Sistema',
      authorRole: 'Sistema',
      content: `Categoría cambiada a "${newCategory}" por ${user.name}.`,
      createdAt: new Date().toISOString(),
    };

    const updatedRequest: CauRequest = {
      ...selectedRequest,
      category: newCategory,
      history: [...selectedRequest.history, categoryChangeMessage],
    };
    
    const updatedRequests = requests.map(r => r.id === updatedRequest.id ? updatedRequest : r);
    onUpdateRequests(updatedRequests);
    setSelectedRequest(updatedRequest);
  }
  
  const handleArchive = () => {
    if (!selectedRequest) return;
    handleStatusChange('Archivada');
    handleDialogClose(false);
  }

  const handleDialogOpen = (request: CauRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setReplyContent('');
      // Set selectedRequest to null after a delay to allow Radix animations to finish
      setTimeout(() => {
        setSelectedRequest(null);
      }, 300);
    }
  }

  const canManage = user?.roles.includes('Admin') || user?.roles.includes('Soporte Aduanas') || user?.roles.includes('Soporte Operativo');
  
  const displayedRequests = canManage ? requests.filter(r => r.status !== 'Archivada') : [];

  if (!canManage) {
    return (
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
    );
  }
  
  const getStatusVariant = (status: CauRequestStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Aprobado':
      case 'Respondido':
        return 'default'; // Using 'default' for success (like green)
      case 'Pendiente':
      case 'Pendiente documentación':
        return 'secondary'; // Yellow/Orange
      case 'En curso':
        return 'outline'; // Blue/Info
      case 'No autorizado':
      case 'Denegado':
        return 'destructive'; // Red
      case 'Archivada':
        return 'outline';
      default:
        return 'outline';
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'S';
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2);
  }
  
  const allStatuses: CauRequestStatus[] = ['Pendiente', 'En curso', 'Pendiente documentación', 'Respondido', 'Aprobado', 'No autorizado', 'Denegado', 'Archivada'];
  
    const getSlaInfo = (slaExpiresAt: string | undefined) => {
    if (!slaExpiresAt) return { text: 'N/A', color: 'text-muted-foreground' };
    const now = new Date();
    const expiryDate = new Date(slaExpiresAt);

    if (isAfter(now, expiryDate)) {
      return { text: 'Vencido', color: 'text-destructive' };
    }

    const hoursRemaining = differenceInHours(expiryDate, now);
    const text = formatDistanceToNowStrict(expiryDate, { addSuffix: true, locale: es });
    
    if (hoursRemaining < 24) {
      return { text: text, color: 'text-amber-600' };
    }

    return { text: text, color: 'text-muted-foreground' };
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bandeja de Entrada de Solicitudes</CardTitle>
            <CardDescription>
              {`Mostrando ${displayedRequests.length} de ${requests.filter(r => r.status !== 'Archivada').length} solicitudes activas.`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimiento</TableHead>
                <TableHead className="hidden md:table-cell">Usuario</TableHead>
                <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRequests.map((request) => {
                const slaInfo = getSlaInfo(request.slaExpiresAt);
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.subject}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                    </TableCell>
                    <TableCell className={cn("hidden sm:table-cell font-medium", slaInfo.color)}>
                        {slaInfo.text}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{request.userName}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>{request.uti || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDialogOpen(request)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRequest.subject}</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  <span>De: {selectedRequest.userName} | Creado: {format(new Date(selectedRequest.createdAt), 'dd MMMM yyyy, HH:mm', { locale: es })}</span>
                  <Badge variant="outline" className="ml-2">{selectedRequest.category}</Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-6 space-y-6">
                {/* Conversation History */}
                <div className="space-y-6">
                  {selectedRequest.history.map((msg, index) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar>
                        <AvatarImage />
                        <AvatarFallback className={
                            msg.authorRole === 'Sistema' ? 'bg-slate-300' :
                            ['Admin', 'Soporte Aduanas', 'Soporte Operativo'].includes(msg.authorRole) ? 'bg-amber-200' : 'bg-sky-200'
                        }>
                          {getInitials(msg.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{msg.author}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), 'dd MMM, HH:mm', { locale: es })}</p>
                        </div>
                        <div className={`p-3 rounded-lg mt-1 ${
                            msg.authorRole === 'Sistema' ? 'bg-slate-100 italic' : 'bg-muted/50'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attachments and UTI */}
                 <div className="space-y-4 pt-4 border-t">
                     {selectedRequest.uti && (
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Matrícula UTI</h4>
                            <p className="text-sm text-muted-foreground">{selectedRequest.uti}</p>
                        </div>
                    )}
                    {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
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
              </div>
              
              <Separator />

              {/* Reply and Status Change Section */}
              <div className="mt-auto pt-4 space-y-4">
                <div className="flex flex-col gap-4">
                    {canManage && (
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="w-full md:w-auto md:flex-1">
                            <label className="text-sm font-medium">Cambiar Estado</label>
                            <Select onValueChange={(val: CauRequestStatus) => handleStatusChange(val)} value={selectedRequest.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="w-full md:w-auto md:flex-1">
                            <label className="text-sm font-medium">Cambiar Categoría</label>
                            <Select onValueChange={(val: CauRequestCategory) => handleCategoryChange(val)} value={selectedRequest.category}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedRequest.status !== 'Archivada' && (
                            <Button variant="outline" onClick={handleArchive}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archivar
                            </Button>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                        <label className="text-sm font-medium">Añadir Respuesta</label>
                        <Textarea 
                            placeholder="Escribe tu respuesta aquí..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                    </div>
                </div>
                 <div className="flex justify-end">
                    <Button onClick={handleReply} disabled={!replyContent.trim()}>
                        <Send className="mr-2 h-4 w-4"/>
                        Enviar Respuesta
                    </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
