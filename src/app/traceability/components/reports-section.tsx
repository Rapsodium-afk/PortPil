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
import { getHistoricalAnalyticsAction, getDetailedOccupancyTrendAction } from '@/lib/traceability';
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
    selectedMonth?: string;
    selectedYear?: string;
    isHistorical?: boolean;
}

export function ReportsSection({ 
    temporalData: initialTemporalData, 
    zoneData: initialZoneData, 
    companyData: initialCompanyData,
    longStayData,
    forecastData,
    zone,
    selectedMonth: propMonth,
    selectedYear: propYear,
    isHistorical: propIsHistorical
}: ReportsSectionProps) {
    const [scale, setScale] = useState<'hour' | 'day' | 'month' | 'year'>('day');
    const [selectedMonth, setSelectedMonth] = useState<string>(propMonth || String(getMonth(new Date()) + 1));
    const [selectedYear, setSelectedYear] = useState<string>(propYear || String(getYear(new Date())));
    const [isHistorical, setIsHistorical] = useState(propIsHistorical || false);
    const [isFallback, setIsFallback] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'total' | 'detailed'>('total');
    
    const [temporalData, setTemporalData] = useState(initialTemporalData);
    const [detailedTemporalData, setDetailedTemporalData] = useState<{ [key: string]: any[] }>({});
    const [zoneData, setZoneData] = useState(initialZoneData);
    const [companyData, setCompanyData] = useState(initialCompanyData);
    const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
    const [zoneTrends, setZoneTrends] = useState<Record<string, any[]>>({});
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [jobResult, setJobResult] = useState<any>(null);

    // Sync state with props ONLY when not in personal historical mode 
    // to avoid overriding local user selections unexpectedly.
    useEffect(() => {
        if (!isHistorical) {
            setTemporalData(initialTemporalData);
            setZoneData(initialZoneData);
            setCompanyData(initialCompanyData);
            if (propMonth) setSelectedMonth(propMonth);
            if (propYear) setSelectedYear(propYear);
            
            // Sync scale
            if (propMonth === '0') setScale('month');
            else setScale('day');
        }
    }, [initialTemporalData, initialZoneData, initialCompanyData, propMonth, propYear]);

    const handleFetchHistorical = async () => {
        setLoading(true);
        try {
            const data = await getHistoricalAnalyticsAction(Number(selectedMonth), Number(selectedYear), zone);
            setTemporalData(data.temporal);
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
    const handleToggleViewMode = async (mode: 'total' | 'detailed') => {
        if (mode === 'detailed' && !detailedTemporalData[scale]) {
            setLoading(true);
            try {
                const data = await getDetailedOccupancyTrendAction(
                    scale, 
                    isHistorical ? Number(selectedMonth) : undefined, 
                    isHistorical ? Number(selectedYear) : undefined, 
                    zone
                );
                setDetailedTemporalData(prev => ({ ...prev, [scale]: data }));
            } catch (error) {
                console.error("Failed to fetch detailed trend", error);
            } finally {
                setLoading(false);
            }
        }
        setViewMode(mode);
    };

    // Force re-fetch detailed if scale changes and we are in detailed mode
    useEffect(() => {
        if (viewMode === 'detailed' && !detailedTemporalData[scale]) {
            handleToggleViewMode('detailed');
        }
    }, [scale]);

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
                <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-lg">
                    <CardHeader className="py-4 px-6 border-b border-slate-100/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight uppercase italic">
                                    <BarChart3 className="h-6 w-6 text-blue-600" />
                                    Inteligencia de Negocio
                                </CardTitle>
                                <CardDescription className="font-medium text-slate-500">Análisis profundo de operaciones y rendimiento portuario</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[110px] h-8 text-[10px] font-black border-none bg-transparent text-blue-700 uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">📅 Anual</SelectItem>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <SelectItem key={i + 1} value={String(i + 1)}>
                                                {format(new Date(2024, i, 1), 'MMMM', { locale: es }).toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[70px] h-8 text-[10px] font-black border-none bg-transparent uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2022">2022</SelectItem>
                                        <SelectItem value="2023">2023</SelectItem>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                        <SelectItem value="2026">2026</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button 
                                size="sm" 
                                variant={isHistorical ? "outline" : "default"}
                                className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isHistorical ? 'bg-blue-600 shadow-blue-500/20 shadow-lg' : ''}`}
                                onClick={handleFetchHistorical}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Clock className="h-3.5 w-3.5 mr-1.5 shadow-sm" />}
                                Ver Análisis
                            </Button>
                            
                            {isHistorical && (
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 px-3 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                                    onClick={resetToRealtime}
                                >
                                    Reset
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Scale Selector relocated here */}
                            <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <span className="text-[9px] font-black text-slate-400 uppercase ml-2 mr-1">Escala:</span>
                                <Select value={scale} onValueChange={(v: any) => setScale(v)}>
                                    <SelectTrigger className="w-[100px] h-7 text-[10px] font-bold border-none bg-transparent">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hour">POR HORA</SelectItem>
                                        <SelectItem value="day">POR DÍA</SelectItem>
                                        <SelectItem value="month">POR MES</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* View Mode Toggle moved here */}
                            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                                <Button 
                                    variant={viewMode === 'total' ? 'secondary' : 'ghost'} 
                                    size="sm" 
                                    className={`h-7 px-3 text-[9px] font-black uppercase rounded-lg transition-all ${viewMode === 'total' ? 'bg-white shadow-sm' : ''}`}
                                    onClick={() => handleToggleViewMode('total')}
                                >
                                    Total
                                </Button>
                                <Button 
                                    variant={viewMode === 'detailed' ? 'secondary' : 'ghost'} 
                                    size="sm" 
                                    className={`h-7 px-3 text-[9px] font-black uppercase rounded-lg transition-all ${viewMode === 'detailed' ? 'bg-white shadow-sm' : ''}`}
                                    onClick={() => handleToggleViewMode('detailed')}
                                >
                                    Por Zonas
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="px-6 py-4 flex flex-wrap items-center gap-4">
                        {isHistorical && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] py-1.5 px-3 font-black rounded-lg">
                                <Info className="h-3.5 w-3.5 mr-1.5" /> 
                                {selectedMonth === '0' ? `ANUAL ${selectedYear}` : `${format(new Date(Number(selectedYear), Number(selectedMonth)-1), 'MMMM yyyy', { locale: es }).toUpperCase()}`}
                            </Badge>
                        )}

                        {activeJobId && (
                            <div className="w-full mt-2">
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
                            <Card className="border-none shadow-sm bg-slate-50/50">
                                <CardContent className="pt-6">
                                    <div className="h-[400px] w-full">
                                        <TrendChart 
                                            data={viewMode === 'detailed' ? detailedTemporalData[scale] || [] : temporalData[scale]} 
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="zones" className="p-6 m-0 outline-none">
                            <div className="grid gap-6">
                                <Card className="border-none shadow-sm bg-slate-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-bold text-slate-800">Detalle Operativo por Terminales</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {zoneData.map((zone: any) => (
                                                <div key={zone.terminal_id} className="flex flex-col gap-1.5 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{zone.terminal_id}</span>
                                                        <Badge variant="secondary" className={`${isFallback ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'} text-[10px] font-bold`}>
                                                            {zone.avg_ocupacion} {isFallback ? "movs" : "veh."}
                                                        </Badge>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
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
