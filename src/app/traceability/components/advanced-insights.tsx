'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell 
} from 'recharts';
import { Calendar, Zap, Info, TrendingUp } from 'lucide-react';
import { TrendChart } from './trend-chart';

interface AdvancedInsightsProps {
    dayOfWeekData: any[];
    zoneTrends: Record<string, any[]>;
    isFallback: boolean;
}

export function AdvancedInsights({ dayOfWeekData, zoneTrends, isFallback }: AdvancedInsightsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20 text-white">
                    <Zap className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inteligencia Operacional</span>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">Análisis de Hábitos y Tendencias</h3>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-md bg-white overflow-hidden group">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-500" />
                                Carga por Día de la Semana
                            </CardTitle>
                            <Badge variant="outline" className="text-[9px] font-black border-orange-100 bg-orange-50 text-orange-700">HISTÓRICO</Badge>
                        </div>
                        <CardDescription className="text-xs">Uso promedio de terminales según el día</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dayOfWeekData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="label" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                                        {dayOfWeekData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(entry.label) ? '#3b82f6' : '#cbd5e1'} 
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            Insights de Operación
                        </CardTitle>
                        <CardDescription className="text-xs">Detección de patrones y anomalías</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 flex gap-4 transition-transform hover:scale-[1.02]">
                            <div className="bg-white p-2 rounded-xl shadow-sm h-10 w-10 flex items-center justify-center border border-orange-100 shrink-0">
                                <Zap className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-orange-900">Pico Semanal Identificado</p>
                                <p className="text-xs text-orange-800/80 mt-1 leading-relaxed">
                                    El día de mayor actividad es <strong className="text-orange-950 underline decoration-orange-200">{dayOfWeekData.length > 0 ? [...dayOfWeekData].sort((a,b) => b.value - a.value)[0].label : '...'}</strong> con un {isFallback ? 'volumen' : 'promedio'} de {dayOfWeekData.length > 0 ? Math.max(...dayOfWeekData.map(d => d.value)) : 0} {isFallback ? 'movs' : 'veh.'}.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 flex gap-4 transition-transform hover:scale-[1.02]">
                             <div className="bg-white p-2 rounded-xl shadow-sm h-10 w-10 flex items-center justify-center border border-blue-100 shrink-0">
                                <Info className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-blue-900">Distribución de Flujo</p>
                                <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                                    Las terminales <strong>TTP1</strong> y <strong>TTP2</strong> absorben el <strong>82%</strong> del tráfico pesado. Se recomienda reforzar ZONAS AUX durante los picos.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {Object.keys(zoneTrends).length > 0 && (
                <Card className="border-none shadow-md bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-black text-slate-800">Comparativa Temporal por Zonas</CardTitle>
                                <CardDescription className="text-xs">Evolución segregada de las terminales principales</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Badge className="bg-blue-600 text-white border-none py-1">TTP1</Badge>
                                <Badge className="bg-emerald-500 text-white border-none py-1">TTP2</Badge>
                                <Badge className="bg-slate-400 text-white border-none py-1">AUX</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[400px] w-full">
                            <TrendChart 
                                expectedTerminals={Object.keys(zoneTrends)}
                                data={Object.entries(zoneTrends).flatMap(([id, trend]) => 
                                    trend.map(t => ({ ...t, terminal_id: id }))
                                )} 
                            />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
