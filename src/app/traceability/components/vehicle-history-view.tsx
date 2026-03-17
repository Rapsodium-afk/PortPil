'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Calendar, Clock, MapPin, ArrowDownCircle, ArrowUpCircle, History, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryEvent {
    id: number;
    terminal_id: string;
    fecha_hora_entrada: Date;
    fecha_hora_salida: Date | null;
    empresa: string | null;
    tipo_vehiculo: string;
    posicion?: string | null;
    estado_aduanero?: string | null;
}

interface VehicleHistoryViewProps {
    matricula: string;
    events: HistoryEvent[];
}

export function VehicleHistoryView({ matricula, events }: VehicleHistoryViewProps) {
    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Sin historial</h3>
                <p className="text-sm text-slate-500">No se han encontrado registros para la matrícula {matricula}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                    <History className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Expediente Individual</h3>
                    <p className="text-xs font-medium text-slate-500">Historial completo de movimientos: <span className="text-blue-600 font-bold">{matricula}</span></p>
                </div>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {events.map((event, index) => {
                    const isLast = index === events.length - 1;
                    const isActive = !event.fecha_hora_salida;
                    
                    return (
                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            {/* Dot */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${isActive ? 'bg-green-500' : 'bg-slate-400'}`}>
                                {isActive ? <Truck className="h-4 w-4 text-white" /> : <Clock className="h-4 w-4 text-white" />}
                            </div>

                            {/* Content */}
                            <Card className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border-none shadow-lg transition-all hover:scale-[1.02] ${isActive ? 'bg-green-50 ring-1 ring-green-100' : 'bg-white'}`}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge variant="outline" className={`font-black text-[10px] ${isActive ? 'bg-green-500 text-white border-none' : 'bg-slate-100 text-slate-600'}`}>
                                            {event.terminal_id}
                                        </Badge>
                                        <time className="text-[10px] font-bold text-slate-400">
                                            {format(new Date(event.fecha_hora_entrada), 'PP', { locale: es })}
                                        </time>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 h-fit bg-white rounded-lg border border-slate-100 shadow-sm">
                                                <ArrowDownCircle className="h-3.5 w-3.5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Entrada</p>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {format(new Date(event.fecha_hora_entrada), 'p', { locale: es })}
                                                </p>
                                            </div>
                                        </div>

                                        {event.fecha_hora_salida ? (
                                            <div className="flex items-start gap-3">
                                                <div className="p-1.5 h-fit bg-white rounded-lg border border-slate-100 shadow-sm">
                                                    <ArrowUpCircle className="h-3.5 w-3.5 text-orange-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">Salida</p>
                                                    <p className="text-xs font-bold text-slate-700">
                                                        {format(new Date(event.fecha_hora_salida), 'p', { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-green-100/50 rounded-lg border border-green-200">
                                                <AlertCircle className="h-3.5 w-3.5 text-green-600" />
                                                <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight">Estancia Activa</span>
                                            </div>
                                        )}

                                            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[10px] font-medium text-slate-500">{event.empresa || 'Empresa Privada'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {event.posicion && (
                                                        <Badge variant="outline" className="text-[9px] border-blue-100 text-blue-600 bg-blue-50/30">
                                                            Pos: {event.posicion}
                                                        </Badge>
                                                    )}
                                                    {event.estado_aduanero && (
                                                        <Badge variant="outline" className={`text-[9px] ${event.estado_aduanero === 'DESPACHADO' ? 'border-emerald-100 text-emerald-600 bg-emerald-50/30' : 'border-amber-100 text-amber-600 bg-amber-50/30'}`}>
                                                            {event.estado_aduanero}
                                                        </Badge>
                                                    )}
                                                    {event.fecha_hora_salida && (
                                                        <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600">
                                                            Permanencia: {Math.round((new Date(event.fecha_hora_salida).getTime() - new Date(event.fecha_hora_entrada).getTime()) / (1000 * 60 * 60))}h
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
