'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, RefreshCw, AlertTriangle } from "lucide-react";
import { readCss, writeCss } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CssEditor() {
  const [css, setCss] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchCss = async () => {
    setIsLoading(true);
    try {
      const content = await readCss();
      setCss(content);
    } catch (error) {
      toast({
        title: "Error al cargar CSS",
        description: "No se pudo leer el archivo globals.css",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCss();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await writeCss(css);
      toast({
        title: "Estilos actualizados",
        description: "El archivo globals.css se ha guardado correctamente. Los cambios se aplicarán al recargar la página."
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo escribir en el archivo globals.css",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-900">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Cuidado al editar Estilos Globales</AlertTitle>
        <AlertDescription className="text-amber-700">
          Este editor modifica directamente <code className="bg-amber-100 px-1 rounded">globals.css</code>. 
          Borrar las directivas <code className="bg-amber-100 px-1 rounded">@tailwind</code> o cometer errores de sintaxis 
          puede romper el diseño de toda la aplicación.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Editor de Estilos (CSS)</CardTitle>
              <CardDescription>
                Personaliza la apariencia global de PortPilot. Utiliza este editor para añadir reglas CSS personalizadas.
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchCss} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            placeholder="/* Añade tus estilos aquí */"
            className="min-h-[500px] font-mono text-sm bg-slate-950 text-slate-50 p-6 border-none focus-visible:ring-1 focus-visible:ring-slate-700 transition-all rounded-md shadow-inner"
            spellCheck={false}
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || isLoading} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar Estilos'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
