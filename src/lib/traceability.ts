'use server';

import { prisma } from './prisma';

export async function takeOccupancySnapshot() {
  try {
    await prisma.$executeRaw`
      INSERT INTO historico_ocupacion_snapshot (terminal_id, ocupacion, fecha_hora)
      SELECT 
        terminal_id, 
        COUNT(*)::integer as ocupacion,
        NOW() as fecha_hora
      FROM movimiento_vehiculo
      WHERE fecha_hora_salida IS NULL
      GROUP BY terminal_id
    `;
  } catch (error) {
    console.error('Error taking occupancy snapshot:', error);
  }
}

export async function getAverageStayData() {
  try {
    // Requirements: 1 day, 2 days, more than 10 days
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '3-10 días'
          ELSE '+10 días'
        END as bucket,
        COUNT(*) as cantidad
      FROM movimiento_vehiculo
      GROUP BY 1
      ORDER BY MIN(EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada))) ASC
    `;
    
    return results.map(r => ({
        ...r,
        cantidad: Number(r.cantidad)
    }));
  } catch (error) {
    console.error('Error fetching stay data:', error);
    return [];
  }
}

export async function getDashboardSummary() {
  try {
    const [zones, lastSnapshots] = await Promise.all([
      prisma.terminal_Zona.findMany({ where: { activa: true } }),
      prisma.$queryRaw<any[]>`
        SELECT s1.* 
        FROM historico_ocupacion_snapshot s1
        INNER JOIN (
          SELECT terminal_id, MAX(fecha_hora) as max_fecha 
          FROM historico_ocupacion_snapshot 
          GROUP BY terminal_id
        ) s2 ON s1.terminal_id = s2.terminal_id AND s1.fecha_hora = s2.max_fecha
      `
    ]);

    return zones.map(zone => {
      const snapshot = lastSnapshots.find(s => s.terminal_id === zone.id);
      return {
        id: zone.id,
        nombre: zone.nombre,
        capacidad: zone.capacidad_maxima,
        ocupacionActual: snapshot ? Number(snapshot.ocupacion) : 0,
        porcentaje: snapshot ? Math.round((Number(snapshot.ocupacion) / zone.capacidad_maxima) * 100) : 0
      };
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return [];
  }
}

export async function getPowerBIData() {
  try {
    const data = await prisma.movimiento_Vehiculo.findMany({
      take: 1000, 
      orderBy: { fecha_hora_entrada: 'desc' }
    });
    
    return data.map(m => ({
      ID: m.id,
      Terminal: m.terminal_id,
      Matricula: m.matricula,
      Entrada: m.fecha_hora_entrada.toISOString(),
      Salida: m.fecha_hora_salida?.toISOString() || null,
      Tipo: m.tipo_vehiculo,
      Empresa: m.empresa,
      Estado: m.fecha_hora_salida ? 'Finalizado' : 'Activo'
    }));
  } catch (error) {
    console.error('Error fetching BI data:', error);
    return [];
  }
}

export async function getOccupancyTrendData() {
  try {
    const trend = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR(fecha_hora, 'DD/MM HH24:00') as label,
        terminal_id,
        AVG(ocupacion)::integer as ocupacion
      FROM historico_ocupacion_snapshot
      WHERE fecha_hora >= NOW() - INTERVAL '48 hours'
      GROUP BY 1, 2
      ORDER BY MIN(fecha_hora) ASC
    `;
    return trend;
  } catch (error) {
    console.error('Error fetching trend data:', error);
    return [];
  }
}

export async function getVehicleDistributionData() {
  try {
    const distribution = await prisma.movimiento_Vehiculo.groupBy({
      by: ['tipo_vehiculo'],
      _count: {
        _all: true
      },
      where: {
        fecha_hora_salida: null
      }
    });

    return distribution.map(d => ({
      name: d.tipo_vehiculo,
      value: d._count._all
    }));
  } catch (error) {
    console.error('Error fetching distribution data:', error);
    return [];
  }
}
export async function getOccupancyByTemporalScale(scale: 'year' | 'month' | 'day' | 'hour', month?: number, year?: number) {
  try {
    const format = {
        year: 'YYYY',
        month: 'YYYY-MM',
        day: 'YYYY-MM-DD',
        hour: 'YYYY-MM-DD HH24:00'
    }[scale];

    let whereClause = '';
    let movementWhereClause = '';
    if (year) {
        if (month && month !== 0) {
            whereClause = `WHERE EXTRACT(YEAR FROM fecha_hora) = ${year} AND EXTRACT(MONTH FROM fecha_hora) = ${month}`;
            movementWhereClause = `WHERE EXTRACT(YEAR FROM fecha_hora_entrada) = ${year} AND EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}`;
        } else {
            whereClause = `WHERE EXTRACT(YEAR FROM fecha_hora) = ${year}`;
            movementWhereClause = `WHERE EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}`;
        }
    }

    // Try fetching snapshots
    let results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR(fecha_hora, '${format}') as label,
        AVG(ocupacion)::integer as value
      FROM historico_ocupacion_snapshot
      ${whereClause}
      GROUP BY 1
      ORDER BY MIN(fecha_hora) ASC
      LIMIT 100
    `);

    // Fallback to Movement Volume if no snapshots (common for historical imported data)
    if (results.length === 0 && (month || year)) {
        results = await prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            TO_CHAR(fecha_hora_entrada, '${format}') as label,
            COUNT(*)::integer as value
          FROM movimiento_vehiculo
          ${movementWhereClause}
          GROUP BY 1
          ORDER BY MIN(fecha_hora_entrada) ASC
          LIMIT 100
        `);
        // Mark as volume data if needed, but keeping the same schema for the chart
    }

    return results;
  } catch (error) {
    console.error(`Error fetching ${scale} occupancy/volume data:`, error);
    return [];
  }
}

/**
 * Compliance: Acción para obtener todos los datos históricos de un periodo
 */
export async function getHistoricalAnalyticsAction(month: number, year: number) {
    try {
        const scale = (month === 0) ? 'month' : 'day';
        
        // Fetch global trend
        const temporal = await getOccupancyByTemporalScale(scale, month, year);
        
        // Fetch per-zone trends for comparison
        const zones_to_track = ['TTP1', 'TTP2', 'ZONAS AUX'];
        const zoneTrends: Record<string, any[]> = {};
        
        await Promise.all(zones_to_track.map(async (z) => {
            // Modified logic based on getOccupancyByTemporalScale but filtering by zone
            const format = scale === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
            let where = `WHERE EXTRACT(YEAR FROM fecha_hora) = ${year} AND terminal_id = '${z}'`;
            if (month !== 0) where += ` AND EXTRACT(MONTH FROM fecha_hora) = ${month}`;
            
            let res = await prisma.$queryRawUnsafe<any[]>(`
                SELECT TO_CHAR(fecha_hora, '${format}') as label, AVG(ocupacion)::integer as value
                FROM historico_ocupacion_snapshot ${where} GROUP BY 1 ORDER BY MIN(fecha_hora) ASC
            `);
            
            if (res.length === 0) {
                let mWhere = `WHERE EXTRACT(YEAR FROM fecha_hora_entrada) = ${year} AND terminal_id = '${z}'`;
                if (month !== 0) mWhere += ` AND EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}`;
                res = await prisma.$queryRawUnsafe<any[]>(`
                    SELECT TO_CHAR(fecha_hora_entrada, '${format}') as label, COUNT(*)::integer as value
                    FROM movimiento_vehiculo ${mWhere} GROUP BY 1 ORDER BY MIN(fecha_hora_entrada) ASC
                `);
            }
            zoneTrends[z] = res;
        }));

        const dayOfWeek = await getOccupancyByDayOfWeekAction(month, year);

        const monthFilter = month !== 0 ? `AND EXTRACT(MONTH FROM fecha_hora) = ${month}` : '';
        const movementMonthFilter = month !== 0 ? `AND EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}` : '';

        let zones = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                terminal_id,
                AVG(ocupacion)::integer as avg_ocupacion,
                false as "isVolume"
            FROM historico_ocupacion_snapshot
            WHERE EXTRACT(YEAR FROM fecha_hora) = ${year}
            ${monthFilter}
            GROUP BY 1
        `);

        // Fallback for zones
        if (zones.length === 0) {
            zones = await prisma.$queryRawUnsafe<any[]>(`
                SELECT 
                    terminal_id,
                    COUNT(*)::integer as avg_ocupacion,
                    true as "isVolume"
                FROM movimiento_vehiculo
                WHERE EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}
                ${movementMonthFilter}
                GROUP BY 1
            `);
        }

        const companies = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                COALESCE(empresa, 'Sin Empresa') as name,
                COUNT(*) as total_movimientos
            FROM movimiento_vehiculo
            WHERE EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}
            ${movementMonthFilter}
            GROUP BY 1
            ORDER BY total_movimientos DESC
            LIMIT 10
        `);

        // Logic to determine if we are showing real occupancy or activity volume fallback
        const isFallback = zones.length > 0 && 
            (zones[0] as any).isVolume === true;

        return {
            temporal,
            zoneTrends,
            dayOfWeek,
            zones,
            companies: companies.map(c => ({ ...c, total_movimientos: Number(c.total_movimientos) })),
            isFallback
        };
    } catch (error) {
        console.error('Error in getHistoricalAnalyticsAction:', error);
        throw error;
    }
}

/**
 * Advanced Analytics: Análisis por día de la semana
 */
export async function getOccupancyByDayOfWeekAction(month: number, year: number) {
    try {
        const monthFilter = month !== 0 ? `AND EXTRACT(MONTH FROM fecha_hora) = ${month}` : '';
        const movementMonthFilter = month !== 0 ? `AND EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}` : '';

        // Try snapshots first
        let results = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                EXTRACT(DOW FROM fecha_hora) as day_index,
                AVG(ocupacion)::integer as value
            FROM historico_ocupacion_snapshot
            WHERE EXTRACT(YEAR FROM fecha_hora) = ${year}
            ${monthFilter}
            GROUP BY 1
            ORDER BY 1 ASC
        `);

        let isFallback = false;
        if (results.length === 0) {
            isFallback = true;
            results = await prisma.$queryRawUnsafe<any[]>(`
                SELECT 
                    EXTRACT(DOW FROM fecha_hora_entrada) as day_index,
                    COUNT(*)::integer as value
                FROM movimiento_vehiculo
                WHERE EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}
                ${movementMonthFilter}
                GROUP BY 1
                ORDER BY 1 ASC
            `);
        }

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return results.map(r => ({
            label: dayNames[Number(r.day_index)],
            value: Number(r.value),
            isFallback
        }));
    } catch (error) {
        console.error('Error in getOccupancyByDayOfWeekAction:', error);
        return [];
    }
}

/**
 * Advanced Analytics: Consultas detalladas con paginación
 */
export async function getDetailedOccupancyLogsAction(params: {
    zone?: string;
    empresa?: string;
    tipo?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}) {
    try {
        const { zone, empresa, tipo, startDate, endDate, page = 1, pageSize = 20 } = params;
        const skip = (page - 1) * pageSize;

        const where: any = {};
        if (zone) where.terminal_id = zone;
        if (empresa) where.empresa = { contains: empresa, mode: 'insensitive' };
        if (tipo) where.tipo_vehiculo = tipo;
        if (startDate || endDate) {
            where.fecha_hora_entrada = {};
            if (startDate) where.fecha_hora_entrada.gte = startDate;
            if (endDate) where.fecha_hora_entrada.lte = endDate;
        }

        const [total, items] = await Promise.all([
            prisma.movimiento_Vehiculo.count({ where }),
            prisma.movimiento_Vehiculo.findMany({
                where,
                orderBy: { fecha_hora_entrada: 'desc' },
                skip,
                take: pageSize
            })
        ]);

        return {
            items,
            total,
            page,
            totalPages: Math.ceil(total / pageSize)
        };
    } catch (error) {
        console.error('Error in getDetailedOccupancyLogsAction:', error);
        throw error;
    }
}

/**
 * Compliance: Acción para obtener el estado de ocupación en un momento histórico dado
 */
export async function getHistoricalStateAction(dateTime: Date) {
    try {
        // Encontrar snapshots más cercanos a esa fecha (+- 1 hora)
        const snapshots = await prisma.$queryRaw<any[]>`
            SELECT s1.*, z.nombre, z.capacidad_maxima
            FROM historico_ocupacion_snapshot s1
            INNER JOIN (
                SELECT terminal_id, MIN(ABS(EXTRACT(EPOCH FROM (fecha_hora - ${dateTime}::timestamp)))) as diff
                FROM historico_ocupacion_snapshot
                WHERE fecha_hora BETWEEN ${dateTime}::timestamp - INTERVAL '2 hours' 
                                 AND ${dateTime}::timestamp + INTERVAL '2 hours'
                GROUP BY terminal_id
            ) s2 ON s1.terminal_id = s2.terminal_id 
                AND ABS(EXTRACT(EPOCH FROM (s1.fecha_hora - ${dateTime}::timestamp))) = s2.diff
            LEFT JOIN terminal_zona z ON s1.terminal_id = z.id
        `;

        return snapshots.map(s => ({
            id: s.terminal_id,
            nombre: s.nombre || `Terminal ${s.terminal_id}`,
            ocupacion: Number(s.ocupacion),
            capacidad: Number(s.capacidad_maxima || 500),
            porcentaje: Math.round((Number(s.ocupacion) / (Number(s.capacidad_maxima) || 500)) * 100)
        }));
    } catch (error) {
        console.error('Error in getHistoricalStateAction:', error);
        return [];
    }
}

export async function getZoneOccupancyByMonth() {
  try {
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR(fecha_hora, 'YYYY-MM') as month,
        terminal_id,
        AVG(ocupacion)::integer as avg_ocupacion
      FROM historico_ocupacion_snapshot
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2 ASC
    `;
    return results;
  } catch (error) {
    console.error('Error fetching zone/month occupancy:', error);
    return [];
  }
}

export async function getCompanyVolumeData() {
  try {
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(empresa, 'Sin Empresa') as name,
        COUNT(*) as total_movimientos,
        COUNT(*) FILTER (WHERE fecha_hora_salida IS NULL) as ocupacion_actual
      FROM movimiento_vehiculo
      GROUP BY 1
      ORDER BY total_movimientos DESC
      LIMIT 10
    `;
    return results.map(r => ({
        ...r,
        total_movimientos: Number(r.total_movimientos),
        ocupacion_actual: Number(r.ocupacion_actual)
    }));
  } catch (error) {
    console.error('Error fetching company volume data:', error);
    return [];
  }
}

/**
 * Compliance: Historial individual por matrícula
 */
export async function getIndividualVehicleHistory(matricula: string) {
    try {
        return await prisma.movimiento_Vehiculo.findMany({
            where: {
                matricula: { equals: matricula }
            },
            orderBy: { fecha_hora_entrada: 'desc' }
        });
    } catch (error) {
        console.error('Error fetching vehicle history:', error);
        return [];
    }
}

/**
 * Compliance: Alertas de larga estancia (>= 5 días)
 */
export async function getLongStayAlerts() {
    try {
        return await prisma.movimiento_Vehiculo.findMany({
            where: {
                fecha_hora_salida: null,
                fecha_hora_entrada: {
                    lte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                }
            },
            orderBy: { fecha_hora_entrada: 'asc' }
        });
    } catch (error) {
        console.error('Error fetching long stay alerts:', error);
        return [];
    }
}

/**
 * Compliance: Predicción a 3 días vista
 */
export async function getPredictiveForecast() {
    try {
        // Lógica simplificada basada en promedios históricos de los últimos 7 días
        const stats = await prisma.$queryRaw<any[]>`
            SELECT 
                EXTRACT(DOW FROM fecha_hora_entrada) as dow,
                COUNT(*) / (SELECT COUNT(DISTINCT DATE(fecha_hora_entrada)) FROM movimiento_vehiculo) as avg_entradas
            FROM movimiento_vehiculo
            WHERE fecha_hora_entrada >= NOW() - INTERVAL '30 days'
            GROUP BY 1
        `;

        const forecast = [];
        const now = new Date();
        for (let i = 1; i <= 3; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);
            const dow = date.getDay();
            const dayStat = stats.find(s => Number(s.dow) === dow);
            forecast.push({
                fecha: date.toISOString().split('T')[0],
                estimacion_entradas: dayStat ? Math.round(Number(dayStat.avg_entradas)) : 0,
                impacto_esperado: (dayStat?.avg_entradas > 500) ? 'Alto' : 'Normal'
            });
        }
        return forecast;
    } catch (error) {
        console.error('Error generating forecast:', error);
        return [];
    }
}

/**
 * Compliance: Estado operativo por zona
 */
export async function getZoneOperationalStatus(zoneId: string) {
    try {
        const zone = await prisma.terminal_Zona.findUnique({ where: { id: zoneId } });
        if (!zone) return 'Desconocido';
        if (!zone.activa) return 'Cerrada';

        const count = await prisma.movimiento_Vehiculo.count({
            where: { terminal_id: zoneId, fecha_hora_salida: null }
        });

        if (count >= zone.capacidad_maxima) return 'Completa';
        if (count >= zone.capacidad_maxima * 0.9) return 'Solo Salidas';
        return 'Abierta';
    } catch (error) {
        return 'Error';
    }
}

/**
 * Compliance: Estado operativo en tiempo real para todas las zonas
 */
export async function getRealTimeStatusData() {
    try {
        const zones = await prisma.terminal_Zona.findMany();
        const results = await Promise.all(zones.map(async (zone) => {
            const occupied = await prisma.movimiento_Vehiculo.count({
                where: { terminal_id: zone.id, fecha_hora_salida: null }
            });
            
            let status = 'Abierta';
            if (!zone.activa) status = 'Cerrada';
            else if (occupied >= zone.capacidad_maxima) status = 'Completa';
            else if (occupied >= zone.capacidad_maxima * 0.9) status = 'Solo Salidas';

            return {
                id: String(zone.id),
                nombre: zone.nombre,
                ocupadas: occupied,
                capacitad: zone.capacidad_maxima,
                disponibles: Math.max(0, zone.capacidad_maxima - occupied),
                porcentaje: (occupied / zone.capacidad_maxima) * 100,
                status
            };
        }));
        return results;
    } catch (error) {
        console.error('Error fetching real-time status:', error);
        return [];
    }
}

export interface MovementFilter {
    matricula?: string;
    terminal_id?: string;
    empresa?: string;
    fechaInicio?: string;
    fechaFin?: string;
}

export async function searchMovements(filters: MovementFilter, limit: number | null = 200) {
    try {
        let where: any = {};
        
        if (filters.matricula) {
            where.matricula = { contains: filters.matricula, mode: 'insensitive' };
        }
        if (filters.terminal_id) {
            where.terminal_id = filters.terminal_id;
        }
        if (filters.empresa) {
            where.empresa = { contains: filters.empresa, mode: 'insensitive' };
        }
        if (filters.fechaInicio || filters.fechaFin) {
            where.fecha_hora_entrada = {};
            if (filters.fechaInicio) where.fecha_hora_entrada.gte = new Date(filters.fechaInicio);
            if (filters.fechaFin) where.fecha_hora_entrada.lte = new Date(filters.fechaFin);
        }

        return await prisma.movimiento_Vehiculo.findMany({
            where,
            orderBy: { fecha_hora_entrada: 'desc' },
            take: limit || undefined
        });
    } catch (error) {
        console.error('Error searching movements:', error);
        return [];
    }
}

export interface ColumnMapping {
    entrada: number;
    salida: number;
    matricula: number;
    empresa: number;
    zona: number;
    posicion: number;
    estado_aduanero: number;
}

/** 
 * Incremental CSV Import with FormData for Large Files
 */
export async function importIncrementalCsvAction(formData: FormData) {
    console.log(`[IncrementalSync] Starting import via FormData`);
    try {
        const file = formData.get('file') as File;
        const mappingStr = formData.get('mapping') as string;
        const delimiter = (formData.get('delimiter') as string) || ';';
        
        if (!file || !mappingStr) {
            throw new Error('Missing file or mapping data');
        }

        const mapping: ColumnMapping = JSON.parse(mappingStr);
        const csvContent = await file.text();
        const lines = csvContent.split('\n');
        
        const movements: any[] = [];
        const uniqueZones = new Set<string>();
        let processed = 0;

        // Helper to trim quotes and whitespace
        const clean = (val: string) => {
            if (!val) return '';
            let s = val.trim();
            if (s.startsWith('"') && s.endsWith('"')) s = s.substring(1, s.length - 1);
            if (s.startsWith("'") && s.endsWith("'")) s = s.substring(1, s.length - 1);
            return s.trim();
        };

        // Helper for robust date parsing
        const parseDate = (val: string) => {
            const cleaned = clean(val);
            if (!cleaned) return null;
            // Attempt to parse as DD/MM/YYYY HH:mm first
            const parts = cleaned.includes(' ') ? cleaned.split(' ') : [cleaned, '00:00'];
            const datePart = parts[0];
            const timePart = parts[1];
            
            const dParts = datePart.split('/').map(Number);
            // Check for DD/MM/YYYY format
            if (dParts.length === 3 && dParts[0] > 0 && dParts[1] > 0 && dParts[2] > 0) {
                const day = dParts[0];
                const month = dParts[1]; // Month is 0-indexed in JS Date
                const year = dParts[2];
                
                const tParts = (timePart.includes(':') ? timePart.split(':') : ['0', '0']).map(Number);
                const hours = tParts[0];
                const minutes = tParts[1];
                const d = new Date(year, month - 1, day, hours, minutes);
                if (!isNaN(d.getTime())) return d;
            }

            // Fallback to generic Date parsing
            const d = new Date(cleaned);
            return isNaN(d.getTime()) ? null : d;
        };

        // Business Rule: Terminal/Zone classification
        const mapTerminal = (val: string) => {
            const z = clean(val).toUpperCase();
            if (z === 'AUTO_ZONE' || !z) return null;
            
            // TTP1 Sub-zones
            if (['ZAS-ADT', 'IMPORT', 'EXPORT-OTROS', 'ADR', 'TTP1'].includes(z)) return 'TTP1';
            
            // TTP2
            if (z === 'TTP2') return 'TTP2';
            
            // Auxiliar Zones
            if (['PK5', 'TTIA', 'CANTIL'].includes(z)) return 'ZONAS AUX';
            
            // Default to the original name if not matched specifically, but cleaned
            return z;
        };

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(delimiter).map(clean);
            // Basic sanity check: ensure we have enough columns for the highest requested index
            const maxIdx = Math.max(...Object.values(mapping));
            if (cols.length <= maxIdx) continue;

            const entrada = parseDate(cols[mapping.entrada]);
            if (!entrada) {
                console.warn(`Skipping row ${i} due to invalid entry date: ${cols[mapping.entrada]}`);
                continue; // Skip rows with invalid entry date
            }

            const rawZona = cols[mapping.zona];
            const zona = mapTerminal(rawZona);
            if (!zona) continue; // Skip non-existent or ignored zones

            uniqueZones.add(zona);

            movements.push({
                terminal_id: zona,
                fecha_hora_entrada: entrada,
                fecha_hora_salida: mapping.salida !== -1 ? parseDate(cols[mapping.salida]) : null,
                matricula: clean(cols[mapping.matricula]) || 'Unknown',
                tipo_vehiculo: 'CAMION',
                empresa: mapping.empresa !== -1 ? (cols[mapping.empresa] || 'N/A') : 'N/A',
                posicion: mapping.posicion !== -1 ? (cols[mapping.posicion] || null) : null,
                estado_aduanero: mapping.estado_aduanero !== -1 ? (cols[mapping.estado_aduanero] || 'PENDIENTE') : 'PENDIENTE'
            });

            if (movements.length >= 500) {
                await flushInternalBatch(movements, uniqueZones);
                processed += movements.length;
                movements.length = 0;
            }
        }

        if (movements.length > 0) {
            await flushInternalBatch(movements, uniqueZones);
            processed += movements.length;
        }

        console.log(`[IncrementalSync] SUCCESS. Processed ${processed} rows.`);
        return { success: true, count: processed };
    } catch (error: any) {
        console.error('[IncrementalSync] FAILED:', error);
        return { success: false, error: error.message };
    }
}

async function flushInternalBatch(movements: any[], zones: Set<string>) {
    // Upsert zones
    for (const id of zones) {
        await prisma.terminal_Zona.upsert({
            where: { id: id as any },
            update: {},
            create: {
                id: id as any,
                nombre: id === 'ZONAS AUX' ? 'Zonas Auxiliares' : `Terminal ${id}`,
                capacidad_maxima: id === 'ZONAS AUX' ? 1000 : 500,
                activa: true
            }
        });
    }
    // Batch insert
    await prisma.movimiento_Vehiculo.createMany({
        data: movements,
        skipDuplicates: true
    });
}

export async function checkDbConnection(): Promise<{ connected: boolean; message?: string }> {
  try {
    if (!prisma) return { connected: false, message: 'Prisma not initialized' };
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error: any) {
    return { 
      connected: false, 
      message: error.message || 'No se pudo establecer conexión con PostgreSQL' 
    };
  }
}
