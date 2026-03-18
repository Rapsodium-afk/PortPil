'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    Cell, PieChart, Pie
} from 'recharts';
import { 
    Calendar, Clock, BarChart3, TrendingUp, Users, 
    MapPin, AlertCircle, ShieldAlert, Zap, Info,
    Loader2, History, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { getHistoricalAnalyticsAction } from '@/lib/traceability';
import { Badge } from "@/components/ui/badge";
import { HistoricalFlashback } from './historical-flashback';
import { TrendChart } from './trend-chart';
import { DistributionChart } from './distribution-chart';
import { AdvancedQueries } from './advanced-queries';
import { AdvancedInsights } from './advanced-insights';
import { startAsyncReportAction } from '@/lib/traceability';
import { AsyncProgress } from './async-progress';

interface ReportsSectionProps {
    temporalData: { [key: string]: any[] };
    zoneData: any[];
    companyData: any[];
    longStayData: any[];
    forecastData: any[];
    zone?: string;
}

export function ReportsSection({ 
    temporalData: initialTemporalData, 
    zoneData: initialZoneData, 
    companyData: initialCompanyData,
    longStayData,
    forecastData,
    zone
}: ReportsSectionProps) {
    const [scale, setScale] = useState<'hour' | 'day' | 'month' | 'year'>('day');
    const [selectedMonth, setSelectedMonth] = useState<string>(String(getMonth(new Date()) + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(getYear(new Date())));
    const [isHistorical, setIsHistorical] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [temporalData, setTemporalData] = useState(initialTemporalData);
    const [zoneData, setZoneData] = useState(initialZoneData);
    const [companyData, setCompanyData] = useState(initialCompanyData);
    const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
    const [zoneTrends, setZoneTrends] = useState<Record<string, any[]>>({});
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [jobResult, setJobResult] = useState<any>(null);

    const handleFetchHistorical = async () => {
        setLoading(true);
        try {
            const data = await getHistoricalAnalyticsAction(Number(selectedMonth), Number(selectedYear), zone);
            setTemporalData({ ...temporalData, day: data.temporal, month: data.temporal });
            setZoneData(data.zones);
            setCompanyData(data.companies as any);
            setDayOfWeekData(data.dayOfWeek || []);
            setZoneTrends(data.zoneTrends || {});
            
            setIsHistorical(true);
            setIsFallback(data.isFallback || false);
            setScale(selectedMonth === '0' ? 'month' : 'day');
        } catch (error) {
            console.error("Failed to fetch historical data", error);
        } finally {
            setLoading(false);
        }
    };

    const resetToRealtime = () => {
        setTemporalData(initialTemporalData);
        setZoneData(initialZoneData);
        setCompanyData(initialCompanyData);
        setIsHistorical(false);
        setIsFallback(false);
        setDayOfWeekData([]);
        setZoneTrends({});
        setActiveJobId(null);
        setJobResult(null);
    };

    const handleStartAsyncReport = async (type: string) => {
        setActiveJobId(null); // Reset previous
        const data = await startAsyncReportAction(type);
        setActiveJobId(data.jobId as string);
    };

    const handleJobComplete = (result: any) => {
        setJobResult(result);
        if (activeJobId && result) {
            // Depending on the job, update relevant UI data
            if (result.forecast) {
                // ... update forecast UI
            }
        }
    };
    
    return (
        <div className="space-y-8">
            {isHistorical && (
                <AdvancedInsights 
                    dayOfWeekData={dayOfWeekData}
                    zoneTrends={zoneTrends}
                    isFallback={isFallback}
                />
            )}

            <Card className="border-none shadow-xl bg-white/40 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-white/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Informes Analíticos Avanzados
                            </CardTitle>
                            <CardDescription>Análisis profundo de operaciones y rendimiento portuario</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Histórico:</span>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[120px] h-8 text-xs font-semibold border-slate-200 bg-white text-blue-600">
                                    <SelectValue placeholder="Periodo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">📅 Todo el año</SelectItem>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <SelectItem key={i + 1} value={String(i + 1)}>
                                            {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[80px] h-8 text-xs font-semibold border-slate-200 bg-white">
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2022">2022</SelectItem>
                                    <SelectItem value="2023">2023</SelectItem>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button 
                                size="sm" 
                                variant={isHistorical ? "outline" : "default"}
                                className="h-8 px-3 text-[10px] font-bold uppercase transition-all"
                                onClick={handleFetchHistorical}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                Ver Análisis
                            </Button>
                            {isHistorical && (
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 px-3 text-[10px] font-bold uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                    onClick={resetToRealtime}
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        {isHistorical && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] py-1 font-bold">
                                <Info className="h-3 w-3 mr-1" /> {selectedMonth === '0' ? `Anual ${selectedYear}` : `${format(new Date(Number(selectedYear), Number(selectedMonth)-1), 'MMMM yyyy', { locale: es })}`}
                            </Badge>
                        )}

                        {activeJobId && (
                            <div className="w-full mt-4">
                                <AsyncProgress 
                                    jobId={activeJobId} 
                                    onComplete={handleJobComplete} 
                                    title="Calculando Informe de Millones de Registros" 
                                />
                            </div>
                        )}
                    </div>

                    <Tabs defaultValue="temporal" className="w-full">
                        <div className="px-6 py-2 bg-slate-50/50 border-b border-slate-100">
                            <TabsList className="bg-transparent gap-4">
                                <TabsTrigger value="temporal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all">
                                    <TrendingUp className="h-3.5 w-3.5 mr-2" />
                                    Evolución temporal
                                </TabsTrigger>
                                <TabsTrigger value="zones" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all">
                                    <MapPin className="h-3.5 w-3.5 mr-2" />
                                    Análisis por zonas
                                </TabsTrigger>
                                <TabsTrigger value="companies" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all">
                                    <Users className="h-3.5 w-3.5 mr-2" />
                                    Actividad por empresa
                                </TabsTrigger>
                                <TabsTrigger value="compliance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all">
                                    <AlertCircle className="h-3.5 w-3.5 mr-2 text-rose-500" />
                                    Alertas & Predicciones
                                </TabsTrigger>
                                <TabsTrigger value="flashback" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all">
                                    <History className="h-3.5 w-3.5 mr-2" />
                                    Snapshot Histórico
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="temporal" className="p-6 m-0 outline-none space-y-6">
                            {!isHistorical && (
                                <div className="flex justify-end mb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <Select value={scale} onValueChange={(v: any) => setScale(v)}>
                                            <SelectTrigger className="w-[120px] h-8 text-xs font-medium border-slate-200">
                                                <SelectValue placeholder="Escala" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hour">Por Hora</SelectItem>
                                                <SelectItem value="day">Por Día</SelectItem>
                                                <SelectItem value="month">Por Mes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                            <Card className="border-none shadow-sm bg-slate-50/50">
                                <CardContent className="pt-6">
                                    <div className="h-[400px] w-full">
                                        <TrendChart data={isHistorical ? (selectedMonth === '0' ? temporalData.month : temporalData.day) : temporalData[scale]} />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="zones" className="p-6 m-0 outline-none">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="border-none shadow-sm bg-slate-50/50">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-bold text-slate-800">Distribución por Terminales</CardTitle>
                                            <Badge variant="secondary" className={`${isFallback ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'} text-[10px] font-bold`}>
                                                {isFallback ? "VOLUMEN" : "OCUPACIÓN"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <DistributionChart data={zoneData} />
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <Card className="border-none shadow-sm bg-slate-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-bold text-slate-800">Detalle Operativo</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {zoneData.map((zone: any) => (
                                                <div key={zone.terminal_id} className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{zone.terminal_id}</span>
                                                        <span className="text-xs font-black text-slate-900">{zone.avg_ocupacion} {isFallback ? "movs" : "veh."}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-500 ${isFallback ? 'bg-indigo-500' : 'bg-blue-500'}`}
                                                            style={{ width: `${Math.min((Number(zone.avg_ocupacion) / (zone.terminal_id === 'ZONAS AUX' ? 1000 : 500)) * 100, 100)}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="companies" className="p-6 m-0 outline-none">
                            <div className="grid gap-6">
                                <Card className="border-none shadow-sm bg-slate-50/50">
                                    <CardHeader>
                                        <CardTitle className="text-base font-black text-slate-800">Top Operadores</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={companyData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis 
                                                        dataKey="name" 
                                                        type="category" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{fontSize: 11, fill: '#64748b', fontWeight: 'bold'}} 
                                                        width={120}
                                                    />
                                                    <Tooltip 
                                                        cursor={{fill: '#f8fafc'}}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="total_movimientos" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="compliance" className="p-6 m-0 outline-none space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-rose-500" /> Alarmas Larga Estancia
                                        </h4>
                                        <Button 
                                            variant="ghost" 
                                            className="h-6 text-[10px] font-bold text-blue-600 uppercase"
                                            onClick={() => handleStartAsyncReport('long-stay')}
                                        >
                                            Refrescar Asíncrono
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {longStayData.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white border border-rose-100 shadow-sm">
                                                <div className="flex gap-4">
                                                    <div className="p-2 bg-rose-100 rounded-lg">
                                                        <Truck className="h-4 w-4 text-rose-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900">{item.matricula}</p>
                                                        <p className="text-[10px] text-slate-400">{item.terminal_id}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">CRÍTICO</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-amber-500" /> Estimación 3 Días
                                        </h4>
                                        <Button 
                                            variant="ghost" 
                                            className="h-6 text-[10px] font-bold text-blue-600 uppercase"
                                            onClick={() => handleStartAsyncReport('predictive')}
                                        >
                                            Recálculo Avanzado
                                        </Button>
                                    </div>
                                    <div className="grid gap-4">
                                        {(jobResult && jobResult.length > 0 ? jobResult : forecastData).map((item: any, i: number) => (
                                            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm transition-all hover:bg-slate-100/80">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{format(new Date(item.fecha), 'EEEE dd', { locale: es })}</p>
                                                    <Badge className={item.impacto_esperado === 'Alto' ? 'bg-rose-500/10 text-rose-600 border-rose-100' : 'bg-emerald-500/10 text-emerald-600 border-emerald-100'} variant="outline">
                                                        {item.impacto_esperado}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Reservas</p>
                                                        <p className="text-lg font-black text-slate-900">{item.reservas ?? '-'}</p>
                                                    </div>
                                                    <div className="p-2 bg-white rounded-lg border border-slate-100">
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Media</p>
                                                        <p className="text-lg font-black text-slate-900">{item.media_historica ?? item.estimacion_entradas ?? '-'}</p>
                                                    </div>
                                                    <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                                                        <p className="text-[9px] text-blue-100 font-bold uppercase">Total</p>
                                                        <p className="text-lg font-black text-white">{item.estimacion_total ?? item.estimacion_entradas ?? '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="flashback" className="p-6 m-0 outline-none">
                            <HistoricalFlashback />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {isHistorical && (
                <div className="mt-8">
                    <AdvancedQueries />
                </div>
            )}
        </div>
    );
}

function Truck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="14"
            viewBox="0 0 24 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18h9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v5a1 1 0 0 0 1 1h2" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
        </svg>
    )
}
