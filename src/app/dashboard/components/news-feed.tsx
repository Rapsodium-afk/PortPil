'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Send, Image as ImageIcon, Upload, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { NewsPost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/actions';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface NewsFeedProps {
  initialNews: NewsPost[];
  onNewsChange: (news: NewsPost[]) => void;
  allowAdd?: boolean;
}

export default function NewsFeed({ initialNews, onNewsChange, allowAdd = true }: NewsFeedProps) {
  const { user, isAdmin, isMediaManager } = useAuth();
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostAuthor, setNewPostAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<NewsPost | null>(null);
  const [news, setNews] = useState(initialNews);
  const [isUploading, setIsUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setNewPostAuthor(user.name);
    }
  }, [user]);

  useEffect(() => {
    setNews(initialNews);
  }, [initialNews]);

  const handleAddPost = async () => {
    if (newPostTitle.trim() && newPostContent.trim() && user) {
      let finalImageUrl = imageUrl;
      
      if (imageFile) {
        setIsUploading(true);
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => {
              const base64 = reader.result as string;
              resolve(base64.split(',')[1]);
            };
          });
          reader.readAsDataURL(imageFile);
          const base64 = await base64Promise;
          
          const uploadResult = await uploadFile(base64, `${Date.now()}-${imageFile.name}`, 'images');
          finalImageUrl = uploadResult.url;
        } catch (error) {
          toast({
            title: "Error al subir imagen",
            description: "No se pudo guardar la imagen en el servidor.",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      const newPost: NewsPost = {
        id: `news-${Date.now()}`,
        title: newPostTitle,
        content: newPostContent,
        author: newPostAuthor || user.name,
        createdAt: new Date().toISOString(),
        imageUrl: finalImageUrl || undefined,
      };
      const updatedNews = [newPost, ...news];
      onNewsChange(updatedNews);
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostAuthor(user.name);
      setImageUrl('');
      setImageFile(null);
      setIsDialogOpen(false);
    }
  };

  const handleDeletePost = (id: string) => {
    const updatedNews = news.filter(post => post.id !== id);
    onNewsChange(updatedNews);
    toast({
      title: "Noticia eliminada",
      description: "La noticia ha sido eliminada correctamente.",
    });
  };

  const handleEditPost = () => {
    if (editingPost && editingPost.title.trim() && editingPost.content.trim()) {
      const updatedNews = news.map(post => 
        post.id === editingPost.id ? { ...editingPost } : post
      );
      onNewsChange(updatedNews);
      setIsEditDialogOpen(false);
      setEditingPost(null);
      toast({
        title: "Noticia actualizada",
        description: "La noticia se ha modificado correctamente.",
      });
    }
  };

  const openEditDialog = (post: NewsPost) => {
    setEditingPost({ ...post });
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Noticias Operativas</CardTitle>
            <CardDescription>Últimas actualizaciones y avisos de la terminal.</CardDescription>
        </div>
        {mounted && user && (isAdmin || isMediaManager) && allowAdd && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Noticia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Noticia Operativa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Título de la Noticia</Label>
                    <Input
                      id="title"
                      placeholder="Ej: Mantenimiento programado..."
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="content">Contenido</Label>
                    <Textarea
                      id="content"
                      placeholder="Escribe la actualización aquí..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="author">Autor / Propietario</Label>
                    <Input
                      id="author"
                      placeholder="Nombre del autor"
                      value={newPostAuthor}
                      onChange={(e) => setNewPostAuthor(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="image">Imagen de la Noticia (Opcional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {imageFile && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setImageFile(null)}
                          className="text-destructive"
                        >
                          <PlusCircle className="h-4 w-4 rotate-45" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      La imagen se guardará localmente en el servidor según la ruta configurada en Ajustes.
                    </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPost} className="w-full" disabled={isUploading}>
                  {isUploading ? (
                    <>Subiendo...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Publicar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {(news || []).map((post) => (
            <div key={post.id} className="flex flex-col items-start gap-4">
               {post.imageUrl && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                    <Image src={post.imageUrl} alt={`Imagen para ${post.id}`} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-lg">{post.title || 'Actualización Operativa'}</h3>
                  {mounted && user && (isAdmin || isMediaManager) && allowAdd && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(post)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
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
                              Esta acción no se puede deshacer. Se eliminará permanentemente la noticia "{post.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePost(post.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <p className="text-sm text-foreground/90">{post.content}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  <span>Por {post.author}</span>
                  <span className="mx-1">·</span>
                  <span>
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Noticia Operativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="edit-title">Título de la Noticia</Label>
                <Input
                  id="edit-title"
                  value={editingPost?.title || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-content">Contenido</Label>
                <Textarea
                  id="edit-content"
                  value={editingPost?.content || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={4}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-author">Autor / Propietario</Label>
                <Input
                  id="edit-author"
                  value={editingPost?.author || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, author: e.target.value } : null)}
                />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditPost} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
