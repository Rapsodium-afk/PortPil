'use client';

import React, { useState } from 'react';
import { MoreHorizontal, PlusCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import type { User, Company } from '@/lib/types';
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
import { UserDialog } from './user-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UsersTableProps {
  initialUsers: User[];
  onUsersChange: (users: User[]) => void;
  onApproveUser: (userId: string) => void;
  allCompanies: Company[];
}

export default function UsersTable({ initialUsers, onUsersChange, onApproveUser, allCompanies }: UsersTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSaveUser = (user: User) => {
    let updatedUsers;
    if (editingUser) {
      updatedUsers = initialUsers.map((u) => (u.id === user.id ? user : u));
    } else {
      updatedUsers = [...initialUsers, { ...user, id: (initialUsers.length + 1).toString() }];
    }
    onUsersChange(updatedUsers);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setEditingUser(null);
      }, 300);
    }
  }

  const openNewUserDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  }

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  }
  
  const getUserCompanies = (user: User) => {
    if (!user.companyIds || user.companyIds.length === 0) return 'N/A';
    return user.companyIds
      .map(id => allCompanies.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }

  return (
    <>
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Listado de Usuarios</CardTitle>
            <CardDescription>Total de {initialUsers.length} usuarios registrados.</CardDescription>
          </div>
          <Button size="sm" onClick={openNewUserDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa(s)</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialUsers.map((user) => (
                <TableRow key={user.id} className={user.status === 'pending' ? 'bg-amber-50' : ''}>
                  <TableCell className="font-medium">
                     <div className="flex items-center gap-2">
                        {user.name}
                        {user.registrationAttachments && user.registrationAttachments.length > 0 && (
                            <Tooltip>
                                <TooltipTrigger>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Contiene adjuntos de registro</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{getUserCompanies(user)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <Badge key={role} variant={role === 'Admin' ? 'destructive' : 'secondary'}>{role}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' 
                        ? <CheckCircle className="mr-1 h-3 w-3" />
                        : <Clock className="mr-1 h-3 w-3" />
                      }
                      {user.status === 'active' ? 'Activo' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0">
                      {user.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => onApproveUser(user.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" /> Aprobar
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditUserDialog(user)}>Editar Usuario</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </TooltipProvider>
      <UserDialog
        isOpen={isDialogOpen}
        setIsOpen={handleDialogClose}
        onSave={handleSaveUser}
        user={editingUser}
        allCompanies={allCompanies}
      />
    </>
  );
}
