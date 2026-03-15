'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Save, Send } from 'lucide-react';
import type { SystemConfig, EmailConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { writeData } from '@/lib/actions';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Truck, QrCode, AlertTriangle } from 'lucide-react';

const emailConfigSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromEmail: z.string().email({ message: 'Debe ser un email válido.' }).optional().or(z.literal('')),
  defaultNotificationPreferences: z.object({
    notifyCauEmail: z.boolean(),
    notifyQrAccessEmail: z.boolean(),
    notifyFleetUpdatesEmail: z.boolean(),
    notifyFleetMovementsEmail: z.boolean(),
    notifyCauReplyEmail: z.boolean(),
  }),
});

type EmailConfigFormValues = z.infer<typeof emailConfigSchema>;

interface EmailSettingsProps {
  initialConfig: SystemConfig;
}

export default function EmailSettings({ initialConfig }: EmailSettingsProps) {
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      smtpHost: initialConfig.emailConfig?.smtpHost || '',
      smtpPort: initialConfig.emailConfig?.smtpPort || 587,
      smtpUser: initialConfig.emailConfig?.smtpUser || '',
      smtpPassword: initialConfig.emailConfig?.smtpPassword || '',
      fromEmail: initialConfig.emailConfig?.fromEmail || '',
      defaultNotificationPreferences: {
        notifyCauEmail: initialConfig.defaultNotificationPreferences?.notifyCauEmail ?? true,
        notifyQrAccessEmail: initialConfig.defaultNotificationPreferences?.notifyQrAccessEmail ?? true,
        notifyFleetUpdatesEmail: initialConfig.defaultNotificationPreferences?.notifyFleetUpdatesEmail ?? true,
        notifyFleetMovementsEmail: initialConfig.defaultNotificationPreferences?.notifyFleetMovementsEmail ?? true,
        notifyCauReplyEmail: initialConfig.defaultNotificationPreferences?.notifyCauReplyEmail ?? true,
      },
    },
  });

  const onSave = async (data: EmailConfigFormValues) => {
    const updatedConfig: SystemConfig = {
      ...initialConfig,
      emailConfig: {
          smtpHost: data.smtpHost,
          smtpPort: data.smtpPort,
          smtpUser: data.smtpUser,
          smtpPassword: data.smtpPassword,
          fromEmail: data.fromEmail,
      },
      defaultNotificationPreferences: data.defaultNotificationPreferences,
    };
    await writeData('config.json', updatedConfig);
    toast({
      title: 'Configuración de Email guardada',
      description: 'Los ajustes del servidor de correo han sido actualizados.',
    });
  };

  const handleSendTestEmail = () => {
    if (!testEmail) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, introduce un destinatario para la prueba.',
      });
      return;
    }
    // In a real implementation, this would call a server action to send an email.
    console.log('Simulating sending test email to:', testEmail);
    toast({
      title: 'Prueba de Email Enviada',
      description: `Se ha enviado un email de prueba a ${testEmail}. Revisa la bandeja de entrada.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Mail className="mr-2"/>Ajustes de Notificaciones por Email</CardTitle>
        <CardDescription>
          Configura el servidor SMTP para el envío de notificaciones automáticas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smtpHost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host SMTP</FormLabel>
                    <FormControl><Input {...field} placeholder="smtp.example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smtpPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puerto SMTP</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smtpUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario SMTP</FormLabel>
                    <FormControl><Input {...field} placeholder="user@example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smtpPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña SMTP</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="••••••••" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email Remitente</FormLabel>
                    <FormControl><Input {...field} placeholder="noreply@portpilot.test" /></FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración de Email
            </Button>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notificaciones Globales (Valores por defecto)</h3>
              <p className="text-sm text-muted-foreground">Activa o desactiva las notificaciones automáticas para todo el sistema.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultNotificationPreferences.notifyCauEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Notificar CAU</FormLabel>
                        <p className="text-[12px] text-muted-foreground">Emails de nuevas solicitudes y respuestas.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultNotificationPreferences.notifyQrAccessEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2"><QrCode className="h-4 w-4" /> Notificar Pases QR</FormLabel>
                        <p className="text-[12px] text-muted-foreground">Emails con el código de acceso al conductor.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultNotificationPreferences.notifyFleetUpdatesEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2"><Truck className="h-4 w-4" /> Notificar Cambios de Flota</FormLabel>
                        <p className="text-[12px] text-muted-foreground">Avisos de altas y bajas de vehículos.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultNotificationPreferences.notifyFleetMovementsEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Notificar Movimientos</FormLabel>
                        <p className="text-[12px] text-muted-foreground">Avisos de entradas y salidas de vehículos.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultNotificationPreferences.notifyCauReplyEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Notificar Respuestas CAU</FormLabel>
                        <p className="text-[12px] text-muted-foreground">Emails cuando un agente responde a un ticket.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
        <Separator className="my-6" />
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Probar Configuración</h3>
            <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="test-email">Enviar email de prueba a:</Label>
                    <Input 
                        id="test-email"
                        type="email"
                        placeholder="destinatario@ejemplo.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                    />
                </div>
                <Button variant="outline" onClick={handleSendTestEmail}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Prueba
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Asegúrate de haber guardado la configuración antes de enviar una prueba.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}