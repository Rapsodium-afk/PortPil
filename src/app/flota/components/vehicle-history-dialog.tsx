'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, Truck } from 'lucide-react';
import type { Vehicle, FleetHistoryEntry } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface VehicleHistoryDialogProps {
    vehicle: Vehicle | null;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function VehicleHistoryDialog({ vehicle, isOpen, setIsOpen }: VehicleHistoryDialogProps) {

    const sortedHistory = vehicle ? [...vehicle.history].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()) : [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial del Vehículo
                    </DialogTitle>
                    <DialogDescription>
                        Trazabilidad de las acciones realizadas sobre la matrícula <span className="font-mono font-semibold">{vehicle?.plate}</span>.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-72 w-full pr-4">
                    <div className="relative pl-6">
                        {/* Timeline line */}
                        <div className="absolute left-9 top-0 h-full w-0.5 bg-border -translate-x-1/2"></div>
                        
                        {sortedHistory.map((entry: FleetHistoryEntry, index) => (
                            <div key={index} className="relative flex items-start gap-6 pb-8">
                                <div className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
                                    <div className="absolute left-9 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary ring-4 ring-background">
                                            <Truck className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm">
                                            {entry.performedBy}
                                        </p>
                                        <time className="text-xs text-muted-foreground">
                                            {format(new Date(entry.performedAt), 'dd MMM, HH:mm', { locale: es })}
                                        </time>
                                    </div>
                                    <p className="text-sm">
                                        Realizó un <Badge variant={entry.action === 'Alta' ? 'default' : 'secondary'}>{entry.action}</Badge>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
