'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, Truck, Building, MapPin, ArrowRight, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { searchMovements, getIndividualVehicleHistory, MovementFilter } from '@/lib/traceability';
import { VehicleHistoryView } from './vehicle-history-view';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function MovementSearch() {
    const [filters, setFilters] = useState<MovementFilter>({
        matricula: '',
        terminal_id: '',
        empresa: '',
        fechaInicio: '',
        fechaFin: '',
    });
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        setSelectedVehicle(null);
        try {
            const data = await searchMovements(filters, 200);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async (matricula: string) => {
        setHistoryLoading(true);
        setSelectedVehicle(matricula);
        try {
            const history = await getIndividualVehicleHistory(matricula);
            setVehicleHistory(history);
        } catch (error) {
            console.error(error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const allData = await searchMovements(filters, null);
            if (allData.length === 0) return;

            // Generate CSV
            const headers = ['Matricula', 'Terminal', 'Empresa', 'Tipo', 'Entrada', 'Salida'];
            const rows = allData.map(m => [
                m.matricula,
                m.terminal_id,
                m.empresa || '',
                m.tipo_vehiculo,
                format(new Date(m.fecha_hora_entrada), 'yyyy-MM-dd HH:mm:ss'),
                m.fecha_hora_salida ? format(new Date(m.fecha_hora_salida), 'yyyy-MM-dd HH:mm:ss') : ''
            ]);

            const csvContent = [
                headers.join(';'),
                ...rows.map(r => r.join(';'))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `export_movimientos_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white/60 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        Buscador Histórico de Movimientos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Matrícula</label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Ej: 1234ABC" 
                                    className="pl-9 h-9 text-xs border-slate-200"
                                    value={filters.matricula}
                                    onChange={(e) => setFilters({...filters, matricula: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Empresa</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Nombre empresa" 
                                    className="pl-9 h-9 text-xs border-slate-200"
                                    value={filters.empresa}
                                    onChange={(e) => setFilters({...filters, empresa: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Zona / Terminal</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="ID Zona" 
                                    className="pl-9 h-9 text-xs border-slate-200"
                                    value={filters.terminal_id}
                                    onChange={(e) => setFilters({...filters, terminal_id: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desde</label>
                            <Input 
                                type="date"
                                className="h-9 text-xs border-slate-200"
                                value={filters.fechaInicio}
                                onChange={(e) => setFilters({...filters, fechaInicio: e.target.value})}
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button 
                                className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                            </Button>
                            <Button 
                                variant="outline" 
                                className="h-9 px-3 border-slate-200"
                                onClick={handleExport}
                                disabled={loading || results.length === 0}
                                title="Exportar resultados a CSV"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {results.length > 0 && (
                <Card className="border-none shadow-lg bg-white overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Matrícula</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Terminal</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Empresa</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Entrada</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Salida</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((item) => (
                                <TableRow 
                                    key={item.id} 
                                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                                    onClick={() => handleViewHistory(item.matricula)}
                                >
                                    <TableCell className="font-bold text-xs text-slate-900">{item.matricula}</TableCell>
                                    <TableCell className="text-xs">
                                        <Badge variant="outline" className="font-medium text-[10px] bg-slate-50">
                                            {item.terminal_id}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-600">{item.empresa || 'N/A'}</TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {format(new Date(item.fecha_hora_entrada), 'PPp', { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        {item.fecha_hora_salida 
                                            ? format(new Date(item.fecha_hora_salida), 'PPp', { locale: es })
                                            : '--'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`text-[10px] border-none ${item.fecha_hora_salida ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                                            {item.fecha_hora_salida ? 'Finalizado' : 'En Terminal'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <Dialog open={selectedVehicle !== null} onOpenChange={(open) => !open && setSelectedVehicle(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {historyLoading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-sm font-bold text-slate-500">Recuperando expediente portuario...</p>
                        </div>
                    ) : (
                        <VehicleHistoryView 
                            matricula={selectedVehicle || ''} 
                            events={vehicleHistory} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
