'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle, Send, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { NewsPost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface NewsFeedProps {
  initialNews: NewsPost[];
  onNewsChange: (news: NewsPost[]) => void;
}

export default function NewsFeed({ initialNews, onNewsChange }: NewsFeedProps) {
  const { user } = useAuth();
  const [newPostContent, setNewPostContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [news, setNews] = useState(initialNews);

  useEffect(() => {
    setNews(initialNews);
  }, [initialNews]);

  const handleAddPost = () => {
    if (newPostContent.trim() && user) {
      const newPost: NewsPost = {
        id: `news-${Date.now()}`,
        content: newPostContent,
        author: user.name,
        createdAt: new Date().toISOString(),
        imageUrl: imageUrl || undefined,
      };
      const updatedNews = [newPost, ...news];
      onNewsChange(updatedNews);
      setNewPostContent('');
      setImageUrl('');
      setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Noticias Operativas</CardTitle>
            <CardDescription>Últimas actualizaciones y avisos de la terminal.</CardDescription>
        </div>
        {user && Array.isArray(user.roles) && user.roles.includes('Media Manager') && (
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
                    <Label htmlFor="imageUrl">URL de la Imagen (Opcional)</Label>
                    <div className='relative'>
                        <ImageIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                        <Input
                            id="imageUrl"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPost} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Publicar
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
              <div className="flex-1">
                <p className="text-sm">{post.content}</p>
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
    </Card>
  );
}
