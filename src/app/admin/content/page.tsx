'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NewsFeed from '@/app/dashboard/components/news-feed';
import { readData, writeData } from '@/lib/actions';
import type { NewsPost } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, FileText, Image as ImageIcon, Plus, Trash2, Download, Pencil, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export default function ContentManagerPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingAnn, setEditingAnn] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isMediaManager, isLoading: authLoading } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    const [newsData, annData] = await Promise.all([
      readData<NewsPost[]>('news.json'),
      readData<any[]>('announcements.json')
    ]);
    setNews(newsData || []);
    setAnnouncements(annData || []);
    setIsDataLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewsChange = async (newNews: NewsPost[]) => {
    setNews(newNews);
    await writeData('news.json', newNews);
  };

  const handleAddAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!title || !file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const uploadResult = await uploadFile(base64, file.name, 'documents');
      
      const newAnn = {
        id: `ann-${Date.now()}`,
        title,
        description,
        fileName: file.name,
        fileUrl: uploadResult.url,
        fileType: file.type,
        createdAt: new Date().toISOString(),
        author: user?.name,
      };

      const updated = [newAnn, ...announcements];
      setAnnouncements(updated);
      await writeData('announcements.json', updated);
      
      (e.target as HTMLFormElement).reset();
      toast({ title: "Comunicado publicado", description: "El archivo se ha subido correctamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo subir el comunicado.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    await writeData('announcements.json', updated);
    toast({ title: "Comunicado eliminado", description: "El registro ha sido eliminado." });
  };

  const handleEditAnnouncement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAnn) return;

    const updated = announcements.map(a => a.id === editingAnn.id ? editingAnn : a);
    setAnnouncements(updated);
    await writeData('announcements.json', updated);
    setIsEditDialogOpen(false);
    setEditingAnn(null);
    toast({ title: "Comunicado actualizado", description: "Los cambios se han guardado correctamente." });
  };

  const openEditAnnDialog = (ann: any) => {
    setEditingAnn({ ...ann });
    setIsEditDialogOpen(true);
  };

  if (authLoading || isDataLoading) {
    return <div className="p-8">Cargando gestor de contenido...</div>;
  }

  if (!isAdmin && !isMediaManager) {
    return <div className="p-8 text-destructive font-bold">Acceso denegado. Se requiere perfil de Admin o Media Manager.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestor de Contenido</h1>
        <p className="text-muted-foreground">Administra las noticias, comunicados y recursos visuales del portal.</p>
      </div>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Noticias Operativas
          </TabsTrigger>
          <TabsTrigger value="notices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Comunicados Oficiales
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media & Imágenes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="space-y-6">
          <NewsFeed initialNews={news} onNewsChange={handleNewsChange} allowAdd={true} />
        </TabsContent>
        
        <TabsContent value="notices" className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Nuevo Comunicado</CardTitle>
              <CardDescription>Sube documentos oficiales (PDF, etc.) para que los usuarios puedan descargarlos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Comunicado</Label>
                    <Input name="title" placeholder="Ej: Protocolo de Seguridad 2024" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">Archivo</Label>
                    <Input name="file" type="file" required className="cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Input name="description" placeholder="Breve descripción del contenido del documento..." />
                </div>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? "Subiendo..." : "Publicar Comunicado"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((ann) => (
              <Card key={ann.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{ann.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditAnnDialog(ann)} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente el comunicado "{ann.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAnnouncement(ann.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardDescription>{ann.fileName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{ann.description || 'Sin descripción'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={ann.fileUrl} download={ann.fileName}>
                        <Download className="mr-2 h-4 w-4" /> Descargar
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="media">
           <Card>
            <CardHeader>
              <CardTitle>Gestor de Media</CardTitle>
              <CardDescription>Administra las imágenes y documentos descargables.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Comunicado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAnnouncement} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-ann-title">Título del Comunicado</Label>
              <Input 
                id="edit-ann-title"
                value={editingAnn?.title || ''} 
                onChange={(e) => setEditingAnn((prev: any) => prev ? { ...prev, title: e.target.value } : null)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ann-desc">Descripción</Label>
              <Textarea 
                id="edit-ann-desc"
                value={editingAnn?.description || ''} 
                onChange={(e) => setEditingAnn((prev: any) => prev ? { ...prev, description: e.target.value } : null)}
                rows={3}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
