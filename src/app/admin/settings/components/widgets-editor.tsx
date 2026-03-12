'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Widget } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { writeData } from '@/lib/actions';

const widgetSchema = z.object({
  title: z.string().min(3, 'El título es requerido.'),
  content: z.string().min(10, 'El contenido (código HTML) es requerido.'),
});

type WidgetFormValues = z.infer<typeof widgetSchema>;

interface WidgetsEditorProps {
  initialWidgets: Widget[];
}

export default function WidgetsEditor({ initialWidgets }: WidgetsEditorProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const { toast } = useToast();

  const form = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const onSubmit = async (data: WidgetFormValues) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      ...data,
    };
    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    await writeData('widgets.json', updatedWidgets);
    toast({
      title: 'Widget creado',
      description: `El widget "${newWidget.title}" ha sido guardado.`,
    });
    form.reset();
  };
  
  const handleDelete = async (widgetId: string) => {
    const updatedWidgets = widgets.filter(r => r.id !== widgetId);
    setWidgets(updatedWidgets);
    await writeData('widgets.json', updatedWidgets);
    toast({
      title: 'Widget eliminado',
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nuevo Widget</CardTitle>
          <CardDescription>Crea nuevos widgets para mostrar en la portada.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Widget</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Previsión de Viento" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido del Widget (Código HTML)</FormLabel>
                    <FormControl><Textarea rows={6} {...field} placeholder="Pega aquí el código HTML, por ejemplo, un <iframe>" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Widget
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Widgets Existentes</CardTitle>
          <CardDescription>Gestiona los widgets de la página de inicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {widgets.map(widget => (
              <div key={widget.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold">{widget.title}</p>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(widget.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
                <div className="mt-2 p-2 bg-muted rounded-md overflow-hidden">
                   <div 
                      className="aspect-video w-full"
                      dangerouslySetInnerHTML={{ __html: widget.content.replace(/height="[^"]*"/, 'height="100%"') }} 
                   />
                </div>
              </div>
            ))}
             {widgets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No hay widgets definidos.</p>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
