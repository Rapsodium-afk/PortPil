'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Search, History, Server, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getHistoricalStateAction } from '@/lib/traceability';

export function HistoricalFlashback() {
    const [dateTime, setDateTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[] | null>(null);
    const [lastSearched, setLastSearched] = useState<string | null>(null);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = await getHistoricalStateAction(new Date(dateTime));
            setData(results);
            setLastSearched(dateTime);
        } catch (error) {
            console.error("Historical state fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden">
            <CardHeader className="border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <History className="h-5 w-5 text-amber-400" />
                            Flashback Histórico
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                            Visualiza el estado de ocupación en un momento exacto del pasado
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fecha y Hora</label>
                        <Input 
                            type="datetime-local" 
                            className="bg-slate-800 border-slate-700 text-white h-9 text-xs"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={handleSearch} 
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-9 px-6 text-xs"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                        Viajar al Momento
                    </Button>
                </div>

                {data && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between py-2 border-b border-slate-800">
                             <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-xs font-semibold">Estado al {format(new Date(lastSearched!), "d 'de' MMMM, yyyy HH:mm", { locale: es })}</span>
                             </div>
                             <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30">DATO HISTÓRICO</Badge>
                        </div>

                        {data.length === 0 ? (
                            <div className="p-8 text-center bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                                <AlertTriangle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-xs text-slate-400">No hay snapshots registrados en este momento exacto.</p>
                                <p className="text-[10px] text-slate-500 mt-1 italic">Intenta buscar una hora cercana.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {data.map((zone) => (
                                    <div key={zone.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700 relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                            <Server size={40} />
                                         </div>
                                         <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{zone.id}</p>
                                         <h4 className="text-sm font-bold text-slate-200 mb-2 truncate">{zone.nombre}</h4>
                                         <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-2xl font-black text-amber-400">{zone.ocupacion}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">VEHÍCULOS</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-300">{zone.porcentaje}%</p>
                                                <div className="w-16 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-amber-500 transition-all duration-700" 
                                                        style={{ width: `${Math.min(zone.porcentaje, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
