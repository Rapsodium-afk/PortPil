'use client';

import React, { useState, useEffect } from 'react';
import { readData } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ComunicadosPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      const data = await readData<any[]>('announcements.json');
      setAnnouncements(data || []);
      setLoading(false);
    }
    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comunicados Oficiales</h1>
        <p className="text-muted-foreground">Accede a la documentación, protocolos y avisos oficiales de la terminal.</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-[200px]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <FileText className="h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">No hay comunicados disponibles</h3>
            <p className="text-muted-foreground">Vuelve más tarde para consultar nuevas actualizaciones.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((ann) => (
            <Card key={ann.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-muted rounded-full">
                    {ann.fileType.split('/')[1] || 'DOC'}
                  </span>
                </div>
                <CardTitle className="mt-4">{ann.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(ann.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm line-clamp-3 min-h-[60px]">
                  {ann.description || 'Este documento oficial no tiene una descripción detallada adjunta.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    Subido por {ann.author || 'Administración'}
                </div>
                <Button className="w-full" asChild>
                  <a href={ann.fileUrl} download={ann.fileName}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar {ann.fileName}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
