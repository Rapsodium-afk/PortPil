'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Image as ImageIcon, Type, Subtitles, PlusCircle, Loader2, Link as LinkIcon } from 'lucide-react';
import type { SystemConfig, ImagePlaceholder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { writeData } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addPlaceholderImage } from '../actions';
import { Textarea } from '@/components/ui/textarea';

interface HeroSettingsProps {
  initialConfig: SystemConfig;
  images: ImagePlaceholder[];
  onUpdate: () => void;
}

const newImageSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida.'),
  imageFile: z.any().refine((val) => typeof window !== 'undefined' && val instanceof File, 'Debe seleccionar una imagen.'),
});
type NewImageFormValues = z.infer<typeof newImageSchema>;

export default function HeroSettings({ initialConfig, images, onUpdate }: HeroSettingsProps) {
  const [config, setConfig] = useState({
    heroTitle: initialConfig.heroTitle || '',
    heroSubtitle: initialConfig.heroSubtitle || '',
    heroImageId: initialConfig.heroImageId || '',
  });
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const { toast } = useToast();

  const newImageForm = useForm<NewImageFormValues>({
    resolver: zodResolver(newImageSchema),
    defaultValues: {
      description: '',
      imageFile: undefined as any,
    },
  });

  const handleSave = async () => {
    const updatedConfig: SystemConfig = {
      ...initialConfig,
      ...config,
    };
    await writeData('config.json', updatedConfig);
    toast({
      title: 'Configuración guardada',
      description: 'La configuración de la portada ha sido actualizada.',
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  }
  
  const handleSelectChange = (value: string) => {
    setConfig(prev => ({ ...prev, heroImageId: value }));
  }

  const handleAddImage = async (data: NewImageFormValues) => {
    setIsSavingImage(true);
    const formData = new FormData();
    formData.append('description', data.description);
    if (data.imageFile) {
      formData.append('image', data.imageFile);
    }
    const result = await addPlaceholderImage(formData);
    if (result.success) {
      toast({ title: 'Imagen añadida', description: 'La nueva imagen ya está disponible en el selector.' });
      onUpdate();
      setIsAddImageOpen(false);
      newImageForm.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error al añadir imagen', description: result.message });
    }
    setIsSavingImage(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ajustes de Portada</CardTitle>
          <CardDescription>
            Gestiona la imagen y los textos principales de la página de inicio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
              <Label htmlFor="heroTitle">Título Principal</Label>
              <div className="relative">
                  <Type className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                      id="heroTitle"
                      name="heroTitle"
                      placeholder="Escribe el título principal"
                      value={config.heroTitle}
                      onChange={handleInputChange}
                      className="pl-8"
                  />
              </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Subtítulo</Label>
              <div className="relative">
                  <Subtitles className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                      id="heroSubtitle"
                      name="heroSubtitle"
                      placeholder="Escribe el subtítulo o texto de apoyo"
                      value={config.heroSubtitle}
                      onChange={handleInputChange}
                      className="pl-8"
                  />
              </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="heroImageId">Imagen de fondo</Label>
              <div className="flex gap-2">
                <Select value={config.heroImageId} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Selecciona una imagen de fondo..." />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {images.map(image => (
                            <SelectItem key={image.id} value={image.id}>{image.description}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Dialog open={isAddImageOpen} onOpenChange={setIsAddImageOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Imagen
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Añadir Nueva Imagen de Fondo</DialogTitle>
                            <DialogDescription>Añade una descripción y la URL de la imagen que quieres usar.</DialogDescription>
                        </DialogHeader>
                        <Form {...newImageForm}>
                            <form onSubmit={newImageForm.handleSubmit(handleAddImage)} className="space-y-4 py-4">
                               <FormField
                                  control={newImageForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Descripción</FormLabel>
                                      <FormControl><Input {...field} placeholder="Ej: Contenedores al atardecer"/></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                               <FormField
                                  control={newImageForm.control}
                                  name="imageFile"
                                  render={({ field: { value, onChange, ...fieldProps } }) => (
                                    <FormItem>
                                      <FormLabel>Archivo de Imagen</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...fieldProps} 
                                          type="file" 
                                          accept="image/*" 
                                          onChange={(event) => {
                                              const file = event.target.files?.[0];
                                              onChange(file);
                                          }} 
                                        />
                                      </FormControl>
                                      <FormDescription>
                                          Selecciona una imagen de tu equipo (JPG, PNG, WEBP).
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddImageOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isSavingImage}>
                                        {isSavingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                        Guardar Imagen
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
              </div>
          </div>
          <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
