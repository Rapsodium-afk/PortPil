'use client';

import React, { useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { CauCategory, CauRequestType } from '@/lib/types';
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RequestTypeDialog } from './request-type-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RequestTypeManagement({ requestTypes, categories, onRequestTypesChange }: {
  requestTypes: CauRequestType[],
  categories: CauCategory[],
  onRequestTypesChange: (newTypes: CauRequestType[]) => void
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CauRequestType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CauRequestType | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { toast } = useToast();

  const handleSaveType = async (requestType: CauRequestType) => {
    let updatedRequestTypes;
    if (editingType) {
      updatedRequestTypes = requestTypes.map((t) => (t.id === requestType.id ? requestType : t));
    } else {
      updatedRequestTypes = [...requestTypes, { ...requestType, id: `type-${Date.now()}` }];
    }
    onRequestTypesChange(updatedRequestTypes);
    setEditingType(null);
  };

  const openNewTypeDialog = () => {
    setEditingType(null);
    setIsDialogOpen(true);
  };

  const openEditTypeDialog = (requestType: CauRequestType) => {
    setEditingType(requestType);
    setIsDialogOpen(true);
  };
  
  const openDeleteDialog = (requestType: CauRequestType) => {
    setTypeToDelete(requestType);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteType = async () => {
    if (typeToDelete) {
      const updatedRequestTypes = requestTypes.filter((t) => t.id !== typeToDelete.id);
      onRequestTypesChange(updatedRequestTypes);
      toast({
        title: "Tipo de Solicitud eliminado",
        description: `El tipo de solicitud "${typeToDelete.title}" ha sido eliminado.`,
      });
      setTypeToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const filteredRequestTypes = filterCategory === 'all'
    ? requestTypes
    : requestTypes.filter(type => type.category === filterCategory);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Editor de Tipos de Solicitud del CAU</CardTitle>
            <CardDescription>
              Define y configura los diferentes tipos de solicitudes que los usuarios pueden crear.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Ver Todas</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button size="sm" onClick={openNewTypeDialog} className="shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Roles Permitidos</TableHead>
                <TableHead>Requerimientos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequestTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">
                    <div>{type.title}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.category === 'Aduaneras' ? 'secondary' : 'outline'}>{type.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {type.allowedRoles && type.allowedRoles.length > 0 ? (
                        type.allowedRoles.map(role => (
                          <Badge key={role} variant="secondary">{role}</Badge>
                        ))
                      ) : (
                        <Badge variant="outline">Todos</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {type.requiresUti && <Badge variant="outline">UTI</Badge>}
                      {type.requiresFile && <Badge variant="outline">Adjunto</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditTypeDialog(type)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(type)} className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRequestTypes.length === 0 && (
             <div className="text-center p-8 text-muted-foreground">
                No se encontraron tipos de solicitud para la categoría seleccionada.
            </div>
          )}
        </CardContent>
      </Card>
      <RequestTypeDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onSave={handleSaveType}
        requestType={editingType}
        categories={categories}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el tipo de solicitud
              <span className="font-semibold"> "{typeToDelete?.title}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteType} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
