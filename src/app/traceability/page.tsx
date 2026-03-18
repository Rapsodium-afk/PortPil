import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    getDashboardSummary, 
    getAverageStayData, 
    takeOccupancySnapshot,
    getOccupancyTrendData,
    getVehicleDistributionData,
    checkDbConnection
} from '@/lib/traceability';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StayChart } from './components/stay-chart';
import { TrendChart } from './components/trend-chart';
import { ReportsSection } from './components/reports-section';
import { MovementSearch } from './components/movement-search';
import { CSVUploader } from './components/csv-uploader';
import { TraceabilityEmptyState } from './components/empty-state';
import { TraceabilityFilters } from './components/traceability-filters';
import { prisma } from '@/lib/prisma';
import { 
    getOccupancyByTemporalScale, 
    getZoneOccupancyByMonth, 
    getCompanyVolumeData,
    getLongStayAlerts,
    getPredictiveForecast,
    getRealTimeStatusData
} from '@/lib/traceability';
import { TerminalStatusDashboard } from './components/terminal-status-dashboard';
import { SnapshotManager } from './components/snapshot-manager';
import { 
    Activity, BarChart3, Clock, Database, FileDown, FileOutput, Filter, History, Info, 
    LayoutDashboard, LineChart, MapPin, PieChart, Search, Server, Settings, ShieldAlert, 
    ShieldCheck, Zap
} from 'lucide-react';

async function seedInitialDataIfNeeded() {
  const zoneCount = await prisma.terminal_Zona.count();
  if (zoneCount === 0) {
    // Seed Terminal Zones
    await prisma.terminal_Zona.createMany({
      data: [
        { id: 'TTP1', nombre: 'Terminal TTP1', capacidad_maxima: 500, descripcion: 'Terminal Principal Norte' },
        { id: 'TTP2', nombre: 'Terminal TTP2', capacidad_maxima: 500, descripcion: 'Terminal Principal Sur' },
        { id: 'ZONAS AUX', nombre: 'Zonas Auxiliares', capacidad_maxima: 1000, descripcion: 'Zonas de apoyo y espera' },
      ]
    });

    // Seed some movements
    const zones = await prisma.terminal_Zona.findMany();
    const now = new Date();
    const vehicleTypes = ['Camión', 'Remolque', 'Portacontenedores', 'Furgoneta'];
    
    for (const zone of zones) {
        const numActive = Math.floor(Math.random() * zone.capacidad_maxima * 0.7);
        const activeData = Array.from({ length: numActive }).map(() => ({
            terminal_id: zone.id,
            matricula: `${Math.floor(Math.random() * 9999)} ABC`,
            fecha_hora_entrada: new Date(now.getTime() - Math.random() * 86400000 * 5),
            tipo_vehiculo: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
            empresa: 'LogisPort S.A.'
        }));
        await prisma.movimiento_Vehiculo.createMany({ data: activeData });
    }
    
    // Take snapshots for history (simulated snapshots for last 48 hours)
    for (let i = 48; i >= 0; i -= 4) {
        const snapDate = new Date(now.getTime() - i * 3600000);
        for (const zone of zones) {
             const baseOccupancy = Math.floor(zone.capacidad_maxima * 0.4);
             const variance = Math.floor(Math.random() * 20);
             await prisma.historico_Ocupacion_Snapshot.create({
                 data: {
                     terminal_id: zone.id,
                     ocupacion: baseOccupancy + (i % 2 === 0 ? variance : -variance),
                     fecha_hora: snapDate
                 }
             });
        }
    }
  }
}

async function DashboardOverview({ zone }: { zone?: string }) {
  const summary = await getDashboardSummary(zone);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summary.map((item) => (
        <Card key={item.id} className="transition-all hover:scale-[1.02] border-none shadow-md bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">{item.nombre}</CardTitle>
            <div className={`p-1.5 rounded-full ${item.porcentaje > 90 ? 'bg-destructive/10 text-destructive' : 'bg-blue-500/10 text-blue-500'}`}>
                <Server className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{item.ocupacionActual} <span className="text-xs font-normal text-slate-500">/ {item.capacidad}</span></div>
            <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${item.porcentaje > 90 ? 'bg-destructive' : 'bg-blue-500'}`} 
                        style={{ width: `${Math.min(item.porcentaje, 100)}%` }} 
                    />
                </div>
                <span className="text-xs font-bold text-slate-600">{item.porcentaje}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Actualizado dinámicamente
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function AnalysisSection({ year, month, zone }: { year?: number, month?: number, zone?: string }) {
    const currentYear = new Date().getFullYear();
    const isHistorical = year && year !== currentYear;

    const [stayData, benchmarkData] = await Promise.all([
        getAverageStayData(year, month, zone),
        isHistorical ? getAverageStayData(currentYear, undefined, zone) : Promise.resolve([])
    ]);
    
    return (
        <div className="grid gap-6 grid-cols-1">
             <StayChart 
                data={stayData as any[]} 
                benchmark={benchmarkData as any[]}
                selectedYear={year || currentYear}
                benchmarkLabel={`Actual (${currentYear})`}
             />
        </div>
    );
}

async function TrendSection({ year, month, zone }: { year?: number, month?: number, zone?: string }) {
    const trendData = await getOccupancyTrendData(year, month, zone);
    return <TrendChart data={trendData} />;
}

async function RealTimeDashboard({ zone }: { zone?: string }) {
    const zones = await getRealTimeStatusData(zone);
    return <TerminalStatusDashboard zones={zones} />;
}

async function ReportingArea({ year: fYear, month: fMonth, zone: fZone }: { year?: number, month?: number, zone?: string }) {
    const [year, month, day, hour, zones, companies, longStay, forecast] = await Promise.all([
        getOccupancyByTemporalScale('year', fMonth, fYear, fZone),
        getOccupancyByTemporalScale('month', fMonth, fYear, fZone),
        getOccupancyByTemporalScale('day', fMonth, fYear, fZone),
        getOccupancyByTemporalScale('hour', fMonth, fYear, fZone),
        getZoneOccupancyByMonth(fYear, fMonth, fZone),
        getCompanyVolumeData(fYear, fMonth, fZone),
        getLongStayAlerts(),
        getPredictiveForecast()
    ]);

    const snapshots = await prisma.historico_Ocupacion_Snapshot.findMany({
        orderBy: { fecha_hora: 'desc' },
        take: 10
    });

    return (
        <div className="space-y-8">
            <ReportsSection 
                temporalData={{ year, month, day, hour }}
                zoneData={zones}
                companyData={companies}
                longStayData={longStay}
                forecastData={forecast}
                zone={fZone}
                selectedYear={fYear ? String(fYear) : undefined}
                selectedMonth={fMonth !== undefined ? String(fMonth) : undefined}
                isHistorical={!!fYear || !!fMonth}
            />
            <SnapshotManager snapshots={snapshots} />
        </div>
    );
}

export default async function TraceabilityPage(props: { searchParams?: Promise<{ year?: string, month?: string, zone?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const connection = await checkDbConnection();
  
  const year = searchParams.year && searchParams.year !== 'Todos' ? parseInt(searchParams.year) : undefined;
  const month = searchParams.month && searchParams.month !== '0' ? parseInt(searchParams.month) : undefined;
  const zone = searchParams.zone && searchParams.zone !== 'Todas' ? searchParams.zone : undefined;

  if (!connection.connected) {
    return (
      <div className="flex-1 space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                  Trazabilidad <span className="text-blue-600">APBA</span>
              </h2>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                  Visualización avanzada de operaciones portuarias.
              </p>
          </div>
        </div>
        <TraceabilityEmptyState error={connection.message} />
      </div>
    );
  }

  try {
      await seedInitialDataIfNeeded();
  } catch (e) {
      console.warn('Seeding failed:', e);
  }

  return (
    <div className="flex-1 space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Trazabilidad <span className="text-blue-600">APBA</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Visualización avanzada de operaciones portuarias en tiempo real con motor de datos PostgreSQL.
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
            <CSVUploader />
            <Button variant="outline" className="shadow-sm h-11">
                <Database className="mr-2 h-4 w-4" />
                Sincronizar DB
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md h-11">
                <FileOutput className="mr-2 h-4 w-4" />
                Exportar PowerBI
            </Button>
        </div>
      </div>
      
      {/* Dashboard Summary and Architecture */}
      <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
              <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[1,2,3,4].map(i => <Card key={i} className="h-32 animate-pulse bg-slate-100 border-none" />)}
              </div>}>
                  <DashboardOverview zone={zone} />
              </Suspense>
          </div>
          <div className="lg:col-span-1">
              <Card className="h-full border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Database size={80} />
                  </div>
                  <CardContent className="p-6 flex flex-col justify-center h-full space-y-4 relative z-10">
                      <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-blue-200" />
                          <h4 className="font-bold text-sm tracking-tight text-white">PostgreSQL Architecture</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                              <p className="text-[10px] text-blue-200">Latencia</p>
                              <p className="text-xs font-bold text-green-300">{'<45ms'}</p>
                          </div>
                          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                              <p className="text-[10px] text-blue-200">Escala</p>
                              <p className="text-xs font-bold font-mono">1M+ recs</p>
                          </div>
                      </div>
                      <p className="text-[9px] leading-relaxed text-blue-50/70">
                          Utilizamos <strong>Snapshots Materializados</strong> y procesamiento concurrente.
                      </p>
                  </CardContent>
              </Card>
          </div>
      </div>

      <TraceabilityFilters />
      
      {/* Real-time Status Dashboard (Compliance Requirement) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20 text-white">
                <Activity className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitorización en Vivo</span>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Estado Operativo de Terminales</h3>
            </div>
        </div>
        <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <Card key={i} className="h-32 animate-pulse bg-slate-100 border-none" />)}
        </div>}>
            <RealTimeDashboard zone={zone} />
        </Suspense>
      </div>

      {/* Main Charts Row */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <LineChart className="h-4 w-4" /> Rendimiento y Tendencias
        </div>
        <div className="grid gap-6 grid-cols-1">
            <Suspense fallback={<div className="h-[400px] bg-slate-100 animate-pulse rounded-xl" />}>
                <TrendSection year={year} month={month} zone={zone} />
            </Suspense>
        </div>
      </div>

      {/* Distribution and Stay Row */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <PieChart className="h-4 w-4" /> Distribución y Estancia
        </div>
        <Suspense fallback={<div className="h-[400px] bg-slate-100 animate-pulse rounded-xl" />}>
            <AnalysisSection year={year} month={month} zone={zone} />
        </Suspense>
      </div>

      {/* Advanced Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <BarChart3 className="h-4 w-4" /> Análisis de Inteligencia de Negocio
        </div>
        <Suspense fallback={<div className="h-[500px] bg-slate-100 animate-pulse rounded-xl" />}>
            <ReportingArea year={year} month={month} zone={zone} />
        </Suspense>
      </div>

      {/* Movement Search Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Search className="h-4 w-4" /> Centro de Búsqueda de Movimientos
        </div>
        <MovementSearch />
      </div>

    </div>
  );
}
