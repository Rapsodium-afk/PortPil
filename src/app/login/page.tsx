'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Anchor, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast({
          title: 'Inicio de sesión exitoso',
          description: 'Bienvenido a PortPilot CAU.',
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error de inicio de sesión',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de inicio de sesión',
        description: 'Ha ocurrido un error inesperado.',
      });
    } finally {
      setIsLoading(false);
    }
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
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <Anchor className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">PortPilot CAU</CardTitle>
          <CardDescription>Centro de Atención al Usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Iniciar Sesión
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
