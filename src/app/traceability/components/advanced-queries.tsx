'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react';

export function AdvancedQueries() {
    const [loading, setLoading] = useState(false);
    const [queryParams, setQueryParams] = useState({
        zone: '',
        empresa: '',
        tipo: '',
        page: 1,
        pageSize: 15
    });
    const [queryResults, setQueryResults] = useState<{items: any[], total: number, totalPages: number}>({
        items: [],
        total: 0,
        totalPages: 0
    });

    const handleRunQuery = async (page: number = 1) => {
        setLoading(true);
        try {
            const { getDetailedOccupancyLogsAction } = await import('@/lib/traceability');
            const res = await getDetailedOccupancyLogsAction({
                ...queryParams,
                page
            });
            setQueryResults(res);
            setQueryParams(prev => ({ ...prev, page }));
        } catch (error) {
            console.error("Query failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                             Explorador de Datos Históricos
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                            Consulta registros exactos de movimientos con filtros avanzados y paginación
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terminal / Zona</label>
                        <Select 
                            value={queryParams.zone} 
                            onValueChange={(v) => setQueryParams({...queryParams, zone: v})}
                        >
                            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs font-semibold">
                                <SelectValue placeholder="Todas las Zonas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TTP1">TTP1</SelectItem>
                                <SelectItem value="TTP2">TTP2</SelectItem>
                                <SelectItem value="ZONAS AUX">ZONAS AUX</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa Transportista</label>
                        <Input 
                            placeholder="Ej: MSC, Maersk..." 
                            className="h-10 bg-white border-slate-200 text-xs"
                            value={queryParams.empresa}
                            onChange={(e) => setQueryParams({...queryParams, empresa: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Vehículo</label>
                        <Select 
                            value={queryParams.tipo} 
                            onValueChange={(v) => setQueryParams({...queryParams, tipo: v})}
                        >
                            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs font-semibold">
                                <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CAMION">Camión</SelectItem>
                                <SelectItem value="TURISMO">Turismo</SelectItem>
                                <SelectItem value="FURGONETA">Furgoneta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold shadow-lg shadow-blue-500/20"
                        onClick={() => handleRunQuery(1)}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Ejecutar Consulta
                    </Button>
                </div>
            </div>

            <CardContent className="p-6">
                {queryResults.items.length > 0 ? (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400">Fecha/Hora Entrada</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400">Matrícula</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400">Terminal</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400">Tipo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400">Empresa</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase text-slate-400">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queryResults.items.map((m, id) => (
                                        <TableRow key={id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="text-xs font-bold text-slate-600">
                                                {format(new Date(m.fecha_hora_entrada), 'dd/MM/yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-xs font-black text-slate-900 tracking-tight">
                                                <code className="bg-slate-100 px-2 py-1 rounded text-blue-700 font-mono">{m.matricula}</code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[9px] font-black tracking-widest border-blue-100 bg-blue-50 text-blue-700">
                                                    {m.terminal_id}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 font-medium">{m.tipo_vehiculo}</TableCell>
                                            <TableCell className="text-xs font-bold truncate max-w-[150px] text-slate-700">{m.empresa || '-'}</TableCell>
                                            <TableCell>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${m.estado_aduanero === 'Fuera' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                                    {m.estado_aduanero}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <p className="text-xs text-slate-500">
                                Mostrando <span className="font-black text-slate-900">{queryResults.items.length}</span> de <span className="font-black text-slate-900">{queryResults.total}</span> registros encontrados
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 w-9 p-0 border-slate-200"
                                    disabled={queryParams.page === 1 || loading}
                                    onClick={() => handleRunQuery(queryParams.page - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1 text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 font-bold">
                                    <span className="text-slate-400">Pág.</span>
                                    <span className="text-blue-600">{queryParams.page}</span>
                                    <span className="text-slate-300 mx-1">/</span>
                                    <span className="text-slate-900">{queryResults.totalPages}</span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 w-9 p-0 border-slate-200"
                                    disabled={queryParams.page === queryResults.totalPages || loading}
                                    onClick={() => handleRunQuery(queryParams.page + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 shadow-inner">
                            <Search className="h-10 w-10 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800">No hay resultados de búsqueda</h4>
                        <p className="text-sm text-slate-500 max-w-[300px] mt-2 leading-relaxed">
                            Personalice los filtros superiores para explorar la base de datos operativa detalladamente.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
