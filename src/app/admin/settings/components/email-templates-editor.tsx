'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Info, Mail } from 'lucide-react';
import type { EmailTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { writeData } from '@/lib/actions';

const templateSchema = z.object({
  subject: z.string().min(3, 'El asunto es requerido.'),
  bodyHtml: z.string().min(10, 'El cuerpo del email es requerido.'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface EmailTemplateEditorProps {
  templates: EmailTemplate[];
  onUpdate: () => Promise<void>;
}

export default function EmailTemplateEditor({ templates, onUpdate }: EmailTemplateEditorProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    values: {
      subject: selectedTemplate?.subject || '',
      bodyHtml: selectedTemplate?.bodyHtml || '',
    },
  });

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplateId ? { ...t, ...data } : t
      );
      
      await writeData('email-templates.json', updatedTemplates);
      await onUpdate();
      
      toast({
        title: 'Plantilla actualizada',
        description: 'Los cambios se han guardado correctamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo actualizar la plantilla.',
      });
    }
  };

  if (!selectedTemplate) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Editor de Plantillas de Email</CardTitle>
              <CardDescription>
                Personaliza el contenido de los correos automáticos enviados por el sistema.
              </CardDescription>
            </div>
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {templates.map(t => (
              <Button
                key={t.id}
                variant={selectedTemplateId === t.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTemplateId(t.id)}
              >
                {t.name}
              </Button>
            ))}
          </div>

          <Separator className="my-6" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Variables Disponibles</AlertTitle>
                <AlertDescription>
                  Puedes usar estas etiquetas que serán reemplazadas por datos reales:
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.placeholders.map(p => (
                      <Badge key={p} variant="secondary">
                        {`{{${p}}}`}
                      </Badge>
                    ))}
                    {selectedTemplate.placeholders.length === 0 && (
                      <span className="text-sm text-muted-foreground italic">No hay variables específicas para esta plantilla.</span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asunto del Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuerpo del Email (HTML)</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={10} 
                        className="font-mono text-sm" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Puedes usar etiquetas HTML básicas para dar formato al correo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
