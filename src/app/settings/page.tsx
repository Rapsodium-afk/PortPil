'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Save, Mail, MessageSquare, Truck, QrCode, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NotificationPreferences, User } from '@/lib/types';

export default function UserSettingsPage() {
  const { user, users, setUsers, config } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifyCauEmail: true,
    notifyQrAccessEmail: true,
    notifyFleetUpdatesEmail: true,
    notifyFleetMovementsEmail: true,
    notifyCauReplyEmail: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, preferences } : u
      );
      
      await setUsers(updatedUsers);
      
      // Update local storage to reflect changes in current session
      const storedUser = localStorage.getItem('portpilot-user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        localStorage.setItem('portpilot-user', JSON.stringify({ ...parsedUser, preferences }));
      }

      toast({
        title: 'Preferencias guardadas',
        description: 'Tus ajustes de notificación han sido actualizados correctamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar las preferencias.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Ajustes</h1>
        <p className="text-muted-foreground">Gestiona tus preferencias personales y notificaciones.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones por Email
          </CardTitle>
          <CardDescription>
            Elige qué notificaciones deseas recibir en tu correo electrónico ({user.email}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-1" />
                <div>
                  <Label htmlFor="notifyCauEmail" className="text-base font-semibold">Mensajes del CAU</Label>
                  <p className="text-sm text-muted-foreground">Recibe avisos cuando se cree una solicitud o se reciba una respuesta en el CAU.</p>
                </div>
              </div>
              <Switch 
                id="notifyCauEmail" 
                checked={preferences.notifyCauEmail} 
                onCheckedChange={() => handleToggle('notifyCauEmail')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-1" />
                <div>
                  <Label htmlFor="notifyCauReplyEmail" className="text-base font-semibold">Respuestas del CAU</Label>
                  <p className="text-sm text-muted-foreground">Recibe avisos específicos cuando un agente responda a tus solicitudes.</p>
                </div>
              </div>
              <Switch 
                id="notifyCauReplyEmail" 
                checked={preferences.notifyCauReplyEmail} 
                onCheckedChange={() => handleToggle('notifyCauReplyEmail')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <QrCode className="h-5 w-5 text-primary mt-1" />
                <div>
                  <Label htmlFor="notifyQrAccessEmail" className="text-base font-semibold">Pases de Acceso QR</Label>
                  <p className="text-sm text-muted-foreground">Recibe una copia de los pases de acceso generados.</p>
                </div>
              </div>
              <Switch 
                id="notifyQrAccessEmail" 
                checked={preferences.notifyQrAccessEmail} 
                onCheckedChange={() => handleToggle('notifyQrAccessEmail')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary mt-1" />
                <div>
                  <Label htmlFor="notifyFleetUpdatesEmail" className="text-base font-semibold">Gestión de Flotas</Label>
                  <p className="text-sm text-muted-foreground">Recibe actualizaciones sobre cambios en la flota de tu empresa.</p>
                </div>
              </div>
              <Switch 
                id="notifyFleetUpdatesEmail" 
                checked={preferences.notifyFleetUpdatesEmail} 
                onCheckedChange={() => handleToggle('notifyFleetUpdatesEmail')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <Label htmlFor="notifyFleetMovementsEmail" className="text-base font-semibold">Movimientos de Flota</Label>
                  <p className="text-sm text-muted-foreground">Recibe alertas sobre movimientos en tiempo real de tus vehículos.</p>
                </div>
              </div>
              <Switch 
                id="notifyFleetMovementsEmail" 
                checked={preferences.notifyFleetMovementsEmail} 
                onCheckedChange={() => handleToggle('notifyFleetMovementsEmail')}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Preferencias
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Configuración del Sistema
          </CardTitle>
          <CardDescription className="text-amber-700">
            Ten en cuenta que algunas notificaciones pueden estar desactivadas de forma global por el administrador del sistema.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
