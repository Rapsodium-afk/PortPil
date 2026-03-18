'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TraceabilityFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentYear = searchParams.get('year') || 'Todos';
    const currentMonth = searchParams.get('month') || '0';
    const currentZone = searchParams.get('zone') || 'Todas';

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'Todos' && value !== '0') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const isFiltered = currentYear !== 'Todos' || currentMonth !== '0' || currentZone !== 'Todas';

    const getMonthName = (monthNum: string) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const m = parseInt(monthNum);
        if (m >= 1 && m <= 12) return months[m - 1];
        return 'Mes';
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/60 p-2 rounded-xl border border-slate-100 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 pl-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">Filtros Globales:</span>
            </div>

            <Select value={currentYear} onValueChange={(v) => handleFilterChange('year', v)}>
                <SelectTrigger className="w-[110px] h-9 text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todos">Todos los Años</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
            </Select>

            <Select value={currentMonth} onValueChange={(v) => handleFilterChange('month', v)} disabled={currentYear === 'Todos'}>
                <SelectTrigger className="w-[120px] h-9 text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0">Todos los Meses</SelectItem>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                            {getMonthName(String(i + 1))}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={currentZone} onValueChange={(v) => handleFilterChange('zone', v)}>
                <SelectTrigger className="w-[140px] h-9 text-xs font-semibold bg-white border-slate-200">
                    <SelectValue placeholder="Zona" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todas">Todas las Zonas</SelectItem>
                    <SelectItem value="TTP1">Terminal TTP1</SelectItem>
                    <SelectItem value="TTP2">Terminal TTP2</SelectItem>
                    <SelectItem value="ZONAS AUX">Zonas Auxiliares</SelectItem>
                </SelectContent>
            </Select>

            {isFiltered && (
                <div className="ml-auto flex items-center gap-2 pr-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 cursor-pointer hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors" onClick={() => router.push('?', { scroll: false })}>
                        Limpiar Filtros
                    </Badge>
                </div>
            )}
        </div>
    );
}
