import { Anchor, LogIn, UserPlus, Info, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import NewsFeed from '@/app/dashboard/components/news-feed';
import { Button } from '@/components/ui/button';
import type { NewsPost, Widget, SituationZone, SystemConfig, ImagePlaceholder } from '@/lib/types';
import { readData, writeData } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default async function Home() {
  const [initialNews, widgets, situationZones, configData, imagesData] = await Promise.all([
    readData<NewsPost[]>('news.json'),
    readData<Widget[]>('widgets.json'),
    readData<SituationZone[]>('situation.json'),
    readData<SystemConfig>('config.json'),
    readData<{ placeholderImages: ImagePlaceholder[] }>('placeholder-images.json'),
  ]);
  
  // Safely access config and images data, providing defaults if the files were missing/malformed.
  const config: SystemConfig = Array.isArray(configData) ? {} as SystemConfig : configData;
  const placeholderImages: ImagePlaceholder[] = (imagesData as any)?.placeholderImages || [];

  const coverImage = placeholderImages.find(p => p.id === (config.heroImageId || 'cargo-ship')) || placeholderImages.find(p => p.id === 'cargo-ship');
  const heroTitle = config.heroTitle || "Portal de Noticias y Novedades";
  const heroSubtitle = config.heroSubtitle || "Manténgase informado sobre las últimas actualizaciones operativas y el estado de la terminal.";

  async function handleNewsChange(newNews: NewsPost[]) {
    'use server';
    await writeData('news.json', newNews);
  }

  const lastUpdate = situationZones.reduce((latest, zone) => {
    const zoneDate = parseISO(zone.lastUpdated);
    return zoneDate > latest ? zoneDate : latest;
  }, new Date(0));

  const getOccupancyPercentage = (zone: SituationZone) => {
    if (zone.maxSpots === 0) return 0;
    const usedSpots = zone.maxSpots - zone.freeSpots;
    return Math.round((usedSpots / zone.maxSpots) * 100);
  };
  
  const getColor = (percentage: number) => {
    if (percentage > 90) return 'bg-destructive';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Anchor className="h-6 w-6 text-primary" />
            <span>{config.portalName || 'PortPilot CAU'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4"/>
                    Registrarse
                </Link>
            </Button>
            <Button asChild>
                <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
                </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative h-80 md:h-96 flex items-center justify-center text-center bg-muted/40">
          {coverImage && (
            <Image
              src={coverImage.imageUrl}
              alt={coverImage.description}
              data-ai-hint={coverImage.imageHint}
              fill
              priority
              className="object-cover -z-10 brightness-50"
            />
          )}
          <div className="p-4 text-white">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {heroTitle}
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
              {heroSubtitle}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid gap-12 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <NewsFeed initialNews={initialNews} onNewsChange={handleNewsChange} allowAdd={false} />
                </div>
                <aside className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Info className="mr-2"/>Estado de la Terminal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {situationZones.map(zone => {
                                const percentage = getOccupancyPercentage(zone);
                                return (
                                    <div key={zone.id}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className='flex items-center gap-2'>
                                                  <span className="font-medium text-sm">{zone.name}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{zone.status}</p>
                                            </div>
                                            <Badge
                                                variant={
                                                    zone.operatingStatus === 'Abierta' ? 'default'
                                                    : zone.operatingStatus === 'Cerrada' ? 'destructive'
                                                    : 'secondary'
                                                }
                                                className={cn(
                                                    'shrink-0',
                                                    zone.operatingStatus === 'Abierta' && 'bg-green-600',
                                                    zone.operatingStatus === 'No operativa' && 'bg-yellow-500 text-white'
                                                )}
                                            >
                                                {zone.operatingStatus}
                                            </Badge>
                                        </div>
                                        <Progress value={percentage} indicatorClassName={getColor(percentage)} className="h-2 my-1" />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Ocupación: {percentage}%</span>
                                            <span>{zone.freeSpots} Libres</span>
                                        </div>
                                    </div>
                                );
                            })}
                             <p className="text-xs text-muted-foreground text-center pt-2">
                                Última actualización: {format(lastUpdate, "dd MMMM yyyy, HH:mm", { locale: es })}
                            </p>
                        </CardContent>
                    </Card>
                    {widgets.map(widget => (
                        <Card key={widget.id}>
                            <CardHeader>
                                <CardTitle>{widget.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    className="w-full aspect-video" 
                                    dangerouslySetInnerHTML={{ __html: widget.content.replace(/height="[^"]*"/, 'height="100%"').replace(/width="[^"]*"/, 'width="100%"') }}
                                />
                            </CardContent>
                        </Card>
                    ))}
                    {widgets.length === 0 && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Widgets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No hay widgets configurados.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </aside>
            </div>
        </section>
      </main>
      <footer className="bg-muted border-t">
        <div className="container mx-auto py-6 px-4 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} {config.portalName || 'PortPilot CAU'}. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
