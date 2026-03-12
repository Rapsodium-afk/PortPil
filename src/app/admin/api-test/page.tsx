
'use client';

import React, { useState } from 'react';
import { Loader2, Search, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { testUtiApi } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ApiTestPage() {
  const [plate, setPlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  // Protect the route for admin users
  if (user && !user.roles.includes('Admin')) {
    router.push('/dashboard');
    return null;
  }

  const handleSearch = async () => {
    if (!plate) return;
    setIsLoading(true);
    setResponse(null);
    const result = await testUtiApi(plate);
    setResponse(result);
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prueba de API de Matrículas</h1>
        <p className="text-muted-foreground">
          Utiliza este panel para realizar consultas directas a la API y ver la respuesta en crudo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Realizar Consulta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Introduce la matrícula..."
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading || !plate}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Consultar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {response && (
        <Card>
            <CardHeader>
                <CardTitle>Respuesta de la API</CardTitle>
                <CardDescription>
                    Esta es la respuesta JSON exacta recibida del servidor.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {response.error ? (
                    <Alert variant="destructive">
                        <FlaskConical className="h-4 w-4" />
                        <AlertTitle>Error en la petición</AlertTitle>
                        <AlertDescription>{response.error}</AlertDescription>
                    </Alert>
                ) : (
                    <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                        {JSON.stringify(response.data, null, 2)}
                    </pre>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
