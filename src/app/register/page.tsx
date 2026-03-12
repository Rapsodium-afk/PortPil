'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Anchor, Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { registerUser } from './actions';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { UserRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileUploadInput from '@/app/cau/components/file-upload-input';
import { Separator } from '@/components/ui/separator';

const registerableRoles = ['Operador Logístico', 'Transitario', 'Agente de Aduanas'] as const;

const registerSchema = z.object({
  name: z.string().min(3, { message: 'El nombre completo es requerido.' }),
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  userType: z.enum(registerableRoles, { required_error: 'Debes seleccionar un tipo de operador.' }),
  companyName: z.string().min(2, { message: 'El nombre de la empresa es requerido.' }),
  taxId: z.string().min(9, { message: 'El CIF/NIF debe tener al menos 9 caracteres.' }),
  attachments: z.array(z.instanceof(File)).optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      companyName: '',
      taxId: '',
      attachments: [],
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    const payload = {
        ...data,
        attachments: data.attachments?.map(file => ({ name: file.name, url: '#' })) || [],
    };
    
    const result = await registerUser(payload);
    if (result.success) {
      setIsSuccess(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description: result.message,
      });
    }
    setIsLoading(false);
  };

  const loginBg = PlaceHolderImages.find(p => p.id === 'login-background');

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {loginBg && (
        <Image
          src={loginBg.imageUrl}
          alt={loginBg.description}
          data-ai-hint={loginBg.imageHint}
          fill
          className="object-cover -z-10 brightness-50"
        />
      )}
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Anchor className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Registro en PortPilot CAU</CardTitle>
          <CardDescription>Crea una nueva cuenta para acceder al sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
                <Alert variant="default" className="border-green-500">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">¡Registro completado!</AlertTitle>
                    <AlertDescription>
                        Tu cuenta ha sido creada y está pendiente de validación por un administrador. Recibirás una notificación cuando sea aprobada.
                    </AlertDescription>
                </Alert>
                <Button className="w-full" asChild>
                    <Link href="/login">Volver a Inicio de Sesión</Link>
                </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <h3 className="text-lg font-medium">Información de la Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl>
                            <Input placeholder="Tu empresa S.L." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>CIF / NIF</FormLabel>
                        <FormControl>
                            <Input placeholder="B12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Operador</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo de operador" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {registerableRoles.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="attachments"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Certificado de Empresa (CIF)</FormLabel>
                        <FormControl>
                            <FileUploadInput 
                                value={field.value || []}
                                onValueChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator className="my-6" />

                <h3 className="text-lg font-medium">Información de Contacto</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo del Solicitante</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre y apellidos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña de Acceso</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Crear Cuenta
                </Button>
              </form>
            </Form>
          )}
           <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
