'use client';

import { Database, AlertTriangle, ArrowRight, Settings, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { initializeTraceabilityDbAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface TraceabilityEmptyStateProps {
  error?: string;
}

export function TraceabilityEmptyState({ error }: TraceabilityEmptyStateProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInstallDb = async () => {
    setIsInstalling(true);
    try {
      const result = await initializeTraceabilityDbAction();
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: result.message,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Fallo en la instalación",
          description: result.message,
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: e.message,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-6 text-center animate-in fade-in duration-500">
      <div className="relative">
        <div className="bg-amber-100 p-6 rounded-full">
          <Database className="h-12 w-12 text-amber-600" />
        </div>
        <div className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">Base de Datos no Conectada</h3>
        <p className="text-slate-500 text-sm">
          El motor de trazabilidad avanzada requiere una conexión activa con PostgreSQL para generar los informes y monitorizar las zonas.
        </p>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-[10px] font-mono rounded border border-red-100 overflow-hidden text-ellipsis">
            Error: {error}
          </div>
        )}
      </div>

      <Card className="max-w-sm border-none shadow-md bg-white">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start gap-3 text-left">
            <div className="bg-blue-100 p-2 rounded-lg mt-1">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800">1. Configurar Credenciales</p>
              <p className="text-xs text-slate-500">Introduce los datos de PostgreSQL en Ajustes.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-left">
            <div className="bg-purple-100 p-2 rounded-lg mt-1">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-sm text-slate-800">2. Instalar Base de Datos</p>
              <p className="text-xs text-slate-500 mb-2">Crearemos las tablas automáticamente por ti.</p>
              <Button 
                onClick={handleInstallDb} 
                disabled={isInstalling}
                size="sm" 
                variant="secondary" 
                className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              >
                {isInstalling ? (
                  <> <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Instalando... </>
                ) : (
                  <> <Sparkles className="mr-2 h-3 w-3" /> Instalar Motor de Datos </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="bg-red-100 p-2 rounded-lg mt-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800">3. Reiniciar Servidor</p>
              <p className="text-xs text-slate-500">Si el error persiste tras instalar, reinicia el servidor.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/admin/settings">
              <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-900">
                Ir a Configuración <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-[10px] text-slate-400 italic">
        Nota: El sistema MariaDB principal sigue operando con normalidad.
      </p>
    </div>
  );
}
