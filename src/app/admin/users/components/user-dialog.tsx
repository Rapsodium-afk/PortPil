'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User, UserRole, Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Building2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const allRoles: UserRole[] = ['Admin', 'Soporte Operativo', 'Soporte Aduanas', 'Media Manager', 'Operador Logístico', 'Transitario',  'Agente de Aduanas',
  'Gestor Situación',
  'Operador Situación',
  'Usuario',
  'Aduana',
];

const userSchema = z.object({
  name: z.string().min(3, { message: 'El nombre es requerido.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  roles: z.array(z.string()).min(1, 'El usuario debe tener al menos un rol.'),
  companyIds: z.array(z.string()).optional(),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }).optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (user: User) => void;
  user: User | null;
  allCompanies: Company[];
}

export function UserDialog({ isOpen, setIsOpen, onSave, user, allCompanies }: UserDialogProps) {
  const { toast } = useToast();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      roles: [],
      companyIds: [],
      password: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          roles: user.roles,
          companyIds: user.companyIds || [],
          password: '',
        });
      } else {
        form.reset({
          name: '',
          email: '',
          roles: [],
          companyIds: [],
          password: '',
        });
      }
    }
  }, [user, isOpen, form]);

  const onSubmit = (data: UserFormValues) => {
    if (!user && !data.password) {
        form.setError("password", { message: "La contraseña es requerida para nuevos usuarios."});
        return;
    }

    const userToSave: User = {
      id: user?.id || Date.now().toString(),
      name: data.name,
      email: data.email,
      roles: data.roles as UserRole[],
      password: data.password || user?.password,
      status: user?.status || 'active',
      companyIds: data.companyIds || [],
      // Keep other properties that are not in the form
      registrationAttachments: user?.registrationAttachments,
    };

    onSave(userToSave);
    toast({
        title: user ? 'Usuario actualizado' : 'Usuario creado',
        description: `El usuario ${data.name} ha sido guardado correctamente.`,
    });
    setIsOpen(false);
  };
  
  const pendingCompany = user?.status === 'pending' && user.companyIds.length > 0 
    ? allCompanies.find(c => c.id === user.companyIds[0]) 
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
        <DialogTitle>{user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
        <DialogDescription>
            {user ? 'Modifica los detalles y roles del usuario.' : 'Rellena el formulario para añadir un nuevo usuario.'}
        </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder={user ? 'Dejar en blanco para no cambiar' : ''} {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <Separator />

            <div className="grid grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="roles"
                render={() => (
                    <FormItem>
                    <FormLabel>Roles</FormLabel>
                    <ScrollArea className="h-40 rounded-lg border p-2">
                        {allRoles.map((role) => (
                        <FormField
                            key={role}
                            control={form.control}
                            name="roles"
                            render={({ field }) => (
                                <FormItem key={role} className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(role)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), role])
                                            : field.onChange(field.value?.filter((value) => value !== role));
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">{role}</FormLabel>
                                </FormItem>
                            )}
                        />
                        ))}
                    </ScrollArea>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="companyIds"
                    render={() => (
                        <FormItem>
                        <FormLabel>Empresas Asociadas</FormLabel>
                        <ScrollArea className="h-40 rounded-lg border p-2">
                            {allCompanies.map((company) => (
                                <FormField
                                    key={company.id}
                                    control={form.control}
                                    name="companyIds"
                                    render={({ field }) => (
                                        <FormItem key={company.id} className="flex flex-row items-start space-x-3 space-y-0 p-2">
                                        <FormControl>
                                            <Checkbox
                                            checked={field.value?.includes(company.id)}
                                            onCheckedChange={(checked) => {
                                                const currentValue = field.value || [];
                                                return checked
                                                ? field.onChange([...currentValue, company.id])
                                                : field.onChange(currentValue.filter((value) => value !== company.id));
                                            }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">{company.name}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </ScrollArea>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            

            {user && user.status === 'pending' && (
                <>
                    <Separator />
                    <div className="space-y-4 rounded-md border bg-muted/50 p-4">
                        <h4 className="font-semibold">Información de Registro</h4>
                        {pendingCompany ? (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><strong>Empresa:</strong> {pendingCompany.name}</p>
                                <p><strong>CIF/NIF:</strong> {pendingCompany.taxId}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No se encontró la información de la empresa.</p>
                        )}
                        {user.registrationAttachments && user.registrationAttachments.length > 0 && (
                            <div>
                                <h5 className="font-medium text-sm">Documentos adjuntos</h5>
                                <ul className="mt-2 space-y-1">
                                    {user.registrationAttachments.map(file => (
                                        <li key={file.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            {file.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </>
            )}


            <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
            </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
