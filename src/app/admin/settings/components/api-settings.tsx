'use client';

import React, { useState } from 'react';
import { KeyRound, Save } from 'lucide-react';
import type { SystemConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { writeData } from '@/lib/actions';
import { Label } from '@/components/ui/label';

interface ApiSettingsProps {
  initialConfig: SystemConfig;
}

export default function ApiSettings({ initialConfig }: ApiSettingsProps) {
  const [utiApiToken, setUtiApiToken] = useState(initialConfig.utiApiToken || '');
  const { toast } = useToast();

  const handleSave = async () => {
    const updatedConfig: SystemConfig = {
      utiApiToken,
    };
    await writeData('config.json', updatedConfig);
    toast({
      title: 'Configuración guardada',
      description: 'La configuración de la API ha sido actualizada.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajustes de API</CardTitle>
        <CardDescription>
          Gestiona las claves y tokens para los servicios externos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="uti-token">Token API de UTI</Label>
            <div className="flex gap-2">
                <Input
                    id="uti-token"
                    type="password"
                    placeholder="Introduce el token JWT"
                    value={utiApiToken}
                    onChange={(e) => setUtiApiToken(e.target.value)}
                />
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Este token se utiliza para validar matrículas UTI en el formulario de solicitudes.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
