'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Info, Users, Activity } from 'lucide-react';

interface ZoneStatus {
    id: string;
    nombre: string;
    ocupadas: number;
    capacitad: number;
    disponibles: number;
    porcentaje: number;
    status: string;
}

interface TerminalStatusDashboardProps {
    zones: ZoneStatus[];
}

export function TerminalStatusDashboard({ zones }: TerminalStatusDashboardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {zones.map((zone) => {
                const isFull = zone.status === 'Completa';
                const isClosed = zone.status === 'Cerrada';
                const isWarning = zone.status === 'Solo Salidas';
                
                return (
                    <Card key={zone.id} className={`border-none shadow-lg overflow-hidden transition-all hover:translate-y-[-4px] ${isClosed ? 'opacity-70 bg-slate-50' : 'bg-white'}`}>
                        <div className={`h-1.5 w-full ${
                            isFull ? 'bg-rose-500' : 
                            isWarning ? 'bg-amber-500' : 
                            isClosed ? 'bg-slate-400' : 'bg-emerald-500'
                        }`} />
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <MapPin className="h-3 w-3 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{zone.id}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800">{zone.nombre}</h4>
                                </div>
                                <Badge className={`text-[9px] font-black uppercase border-none ${
                                    isFull ? 'bg-rose-100 text-rose-700' : 
                                    isWarning ? 'bg-amber-100 text-amber-700' : 
                                    isClosed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {zone.status}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[24px] font-black text-slate-900 leading-none">{zone.ocupadas}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vehículos</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[14px] font-bold text-slate-600 leading-none">{zone.disponibles}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Libres</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-slate-400 uppercase">Ocupación</span>
                                        <span className={zone.porcentaje > 90 ? 'text-rose-500' : 'text-slate-600'}>
                                            {Math.round(zone.porcentaje)}%
                                        </span>
                                    </div>
                                    <Progress value={zone.porcentaje} className="h-1.5 bg-slate-100" />
                                </div>
                                
                                <div className="pt-2 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${isClosed ? 'bg-slate-300' : 'bg-emerald-400'}`} />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Sistema Operativo</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
