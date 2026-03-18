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

export async function getAverageStayData(year?: number, month?: number, zone?: string) {
  try {
    const conditions = [];
    if (year) conditions.push(`EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}`);
    if (month && month !== 0) conditions.push(`EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}`);
    if (zone && zone !== 'Todas') conditions.push(`terminal_id = '${zone}'`);
    
    const whereClause = conditions.length > 0 ? `WHERE ` + conditions.join(' AND ') : '';

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        CASE 
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 3 THEN '3 días'
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 4 THEN '4 días'
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 5 THEN '5 días'
          WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '7-10 días'
          ELSE '+10 días'
        END as bucket,
        COUNT(*) as cantidad
      FROM movimiento_vehiculo
      ${whereClause}
      GROUP BY 1
      ORDER BY 
        CASE 
          WHEN (CASE 
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 3 THEN '3 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 4 THEN '4 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 5 THEN '5 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '7-10 días'
            ELSE '+10 días'
          END) = '1 día' THEN 1
          WHEN (CASE 
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 3 THEN '3 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 4 THEN '4 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 5 THEN '5 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '7-10 días'
            ELSE '+10 días'
          END) = '2 días' THEN 2
          WHEN (CASE 
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 3 THEN '3 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 4 THEN '4 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 5 THEN '5 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '7-10 días'
            ELSE '+10 días'
          END) = '3 días' THEN 3
          WHEN (CASE 
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 3 THEN '3 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 4 THEN '4 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 5 THEN '5 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '7-10 días'
            ELSE '+10 días'
          END) = '4 días' THEN 4
          WHEN (CASE 
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 3 THEN '3 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 4 THEN '4 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 5 THEN '5 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '7-10 días'
            ELSE '+10 días'
          END) = '5 días' THEN 5
          WHEN (CASE 
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 1 THEN '1 día'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 2 THEN '2 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 3 THEN '3 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 4 THEN '4 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 5 THEN '5 días'
            WHEN EXTRACT(DAY FROM (COALESCE(fecha_hora_salida, NOW()) - fecha_hora_entrada)) <= 10 THEN '7-10 días'
            ELSE '+10 días'
          END) = '7-10 días' THEN 6
          ELSE 7
        END ASC
    `);
    
    return results.map(r => ({
        ...r,
        cantidad: Number(r.cantidad)
    }));
  } catch (error) {
    console.error('Error fetching stay data:', error);
    return [];
  }
}

export async function getDashboardSummary(zone?: string) {
  try {
    const whereZone = zone && zone !== 'Todas' ? { id: zone } : {};
    const [zones, lastSnapshots] = await Promise.all([
      prisma.terminal_Zona.findMany({ where: { activa: true, ...whereZone } }),
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

    return zones.map(z => {
      const snapshot = lastSnapshots.find(s => s.terminal_id === z.id);
      return {
        id: z.id,
        nombre: z.nombre,
        capacidad: z.capacidad_maxima,
        ocupacionActual: snapshot ? Number(snapshot.ocupacion) : 0,
        porcentaje: snapshot ? Math.round((Number(snapshot.ocupacion) / z.capacidad_maxima) * 100) : 0
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

export async function getOccupancyTrendData(year?: number, month?: number, zone?: string) {
  try {
    const conditions = [];
    if (year) conditions.push(`EXTRACT(YEAR FROM fecha_hora) = ${year}`);
    if (month && month !== 0) conditions.push(`EXTRACT(MONTH FROM fecha_hora) = ${month}`);
    if (zone && zone !== 'Todas') conditions.push(`terminal_id = '${zone}'`);
    
    if (!year && !month) {
        conditions.push(`fecha_hora >= NOW() - INTERVAL '7 days'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ` + conditions.join(' AND ') : '';
    
    let format = "'DD/MM HH24:00'";
    if (year && !month) format = "'YYYY-MM'";
    if (year && month) format = "'DD/MM/YYYY'";

    const trend = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR(fecha_hora, ${format}) as label,
        terminal_id,
        AVG(ocupacion)::integer as ocupacion
      FROM historico_ocupacion_snapshot
      ${whereClause}
      GROUP BY 1, 2
      ORDER BY MIN(fecha_hora) DESC
      LIMIT 100
    `);
    
    return trend.reverse();
  } catch (error) {
    console.error('Error fetching trend data:', error);
    return [];
  }
}

export async function getVehicleDistributionData(year?: number, month?: number, zone?: string) {
  try {
    let whereClause: any = {
      fecha_hora_salida: null // Default real-time logic
    };

    if (year || month || (zone && zone !== 'Todas')) {
        whereClause = {};
        if (year) {
            whereClause.fecha_hora_entrada = {
                gte: new Date(year, (month ? month - 1 : 0), 1),
                lt: month ? new Date(year, month, 1) : new Date(year + 1, 0, 1)
            };
        }
        if (zone && zone !== 'Todas') whereClause.terminal_id = zone;
    }

    const distribution = await prisma.movimiento_Vehiculo.groupBy({
      by: ['tipo_vehiculo'],
      _count: {
        _all: true
      },
      where: whereClause
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
export async function getOccupancyByTemporalScale(scale: 'year' | 'month' | 'day' | 'hour', month?: number, year?: number, zone?: string, detailed: boolean = false) {
  try {
    const format = {
        year: 'YYYY',
        month: 'YYYY-MM',
        day: 'YYYY-MM-DD',
        hour: 'YYYY-MM-DD HH24:00'
    }[scale];

    let whereClause = '';
    let movementWhereClause = '';
    const conditions = [];
    const movementConditions = [];
    
    if (year) {
        conditions.push(`EXTRACT(YEAR FROM fecha_hora) = ${year}`);
        movementConditions.push(`EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}`);
    }
    if (month && month !== 0) {
        conditions.push(`EXTRACT(MONTH FROM fecha_hora) = ${month}`);
        movementConditions.push(`EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}`);
    }
    if (zone && zone !== 'Todas') {
        conditions.push(`terminal_id = '${zone}'`);
        movementConditions.push(`terminal_id = '${zone}'`);
    }

    if (conditions.length > 0) {
        whereClause = `WHERE ` + conditions.join(' AND ');
        movementWhereClause = `WHERE ` + movementConditions.join(' AND ');
    }

    // Try fetching snapshots
    let results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR(fecha_hora, '${format}') as label,
        ${detailed ? 'terminal_id,' : ''}
        AVG(ocupacion)::integer as value
      FROM historico_ocupacion_snapshot
      ${whereClause}
      GROUP BY 1 ${detailed ? ', 2' : ''}
      ORDER BY MIN(fecha_hora) ASC
      LIMIT 300
    `);

    // Fallback to Movement Volume if no snapshots (common for historical imported data)
    if (results.length === 0 && (month || year)) {
        results = await prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            TO_CHAR(fecha_hora_entrada, '${format}') as label,
            ${detailed ? 'terminal_id,' : ''}
            COUNT(*)::integer as value
          FROM movimiento_vehiculo
          ${movementWhereClause}
          GROUP BY 1 ${detailed ? ', 2' : ''}
          ORDER BY MIN(fecha_hora_entrada) ASC
          LIMIT 300
        `);
        // Mark as volume data if needed, but keeping the same schema for the chart
    }

    return results;
  } catch (error) {
    console.error(`Error fetching ${scale} occupancy/volume data:`, error);
    return [];
  }
}

export async function getHistoricalAnalyticsAction(month: number, year: number, zone?: string) {
    try {
        const scale = (month === 0) ? 'month' : 'day';
        
        // Fetch global trend
        const [yearData, monthData, dayData, hourData] = await Promise.all([
            getOccupancyByTemporalScale('year', month, year, zone),
            getOccupancyByTemporalScale('month', month, year, zone),
            getOccupancyByTemporalScale('day', month, year, zone),
            getOccupancyByTemporalScale('hour', month, year, zone)
        ]);
        const temporal = { year: yearData, month: monthData, day: dayData, hour: hourData };
        
        // Fetch per-zone trends for comparison (only if specific zone isn't selected or we want to compare)
        // If a specific zone is selected globally, we might only want that zone, but usually comparing is nice.
        const zones_to_track = zone && zone !== 'Todas' ? [zone] : ['TTP1', 'TTP2', 'ZONAS AUX'];
        const zoneTrends: Record<string, any[]> = {};
        
        await Promise.all(zones_to_track.map(async (z) => {
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

        const dayOfWeek = await getOccupancyByDayOfWeekAction(month, year, null);

        const conditions = [];
        const mConditions = [];
        if (year) { conditions.push(`EXTRACT(YEAR FROM fecha_hora) = ${year}`); mConditions.push(`EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}`); }
        if (month && month !== 0) { conditions.push(`EXTRACT(MONTH FROM fecha_hora) = ${month}`); mConditions.push(`EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}`); }
        
        let monthFilter = conditions.length > 0 ? conditions.join(' AND ') : '';
        let movementMonthFilter = mConditions.length > 0 ? mConditions.join(' AND ') : '';

        let zones = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                terminal_id,
                AVG(ocupacion)::integer as avg_ocupacion,
                false as "isVolume"
            FROM historico_ocupacion_snapshot
            ${monthFilter ? 'WHERE ' + monthFilter : ''}
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
                ${movementMonthFilter ? 'WHERE ' + movementMonthFilter : ''}
                GROUP BY 1
            `);
        }

        const companies = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                COALESCE(empresa, 'Sin Empresa') as name,
                COUNT(*) as total_movimientos
            FROM movimiento_vehiculo
            ${movementMonthFilter ? 'WHERE ' + movementMonthFilter : ''}
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
export async function getOccupancyByDayOfWeekAction(month: number, year: number, zone?: string | null) {
    try {
        const conditions = [];
        const mConditions = [];
        if (year) { conditions.push(`EXTRACT(YEAR FROM fecha_hora) = ${year}`); mConditions.push(`EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}`); }
        if (month && month !== 0) { conditions.push(`EXTRACT(MONTH FROM fecha_hora) = ${month}`); mConditions.push(`EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}`); }
        if (zone && zone !== 'Todas') { conditions.push(`terminal_id = '${zone}'`); mConditions.push(`terminal_id = '${zone}'`); }
        
        const monthFilter = conditions.length > 0 ? `WHERE ` + conditions.join(' AND ') : '';
        const movementMonthFilter = mConditions.length > 0 ? `WHERE ` + mConditions.join(' AND ') : '';

        // Try snapshots first
        let results = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                EXTRACT(DOW FROM fecha_hora) as day_index,
                AVG(ocupacion)::integer as value
            FROM historico_ocupacion_snapshot
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

export async function getZoneOccupancyByMonth(year?: number, month?: number, zone?: string) {
  try {
    const conditions = [];
    if (year) conditions.push(`EXTRACT(YEAR FROM fecha_hora) = ${year}`);
    if (month && month !== 0) conditions.push(`EXTRACT(MONTH FROM fecha_hora) = ${month}`);
    if (zone && zone !== 'Todas') conditions.push(`terminal_id = '${zone}'`);
    
    const whereClause = conditions.length > 0 ? `WHERE ` + conditions.join(' AND ') : '';

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR(fecha_hora, 'YYYY-MM') as month,
        terminal_id,
        AVG(ocupacion)::integer as avg_ocupacion
      FROM historico_ocupacion_snapshot
      ${whereClause}
      GROUP BY 1, 2
      ORDER BY 1 ASC, 2 ASC
    `);
    return results;
  } catch (error) {
    console.error('Error fetching zone/month occupancy:', error);
    return [];
  }
}

export async function getCompanyVolumeData(year?: number, month?: number, zone?: string) {
  try {
    const conditions = [];
    if (year) conditions.push(`EXTRACT(YEAR FROM fecha_hora_entrada) = ${year}`);
    if (month && month !== 0) conditions.push(`EXTRACT(MONTH FROM fecha_hora_entrada) = ${month}`);
    if (zone && zone !== 'Todas') conditions.push(`terminal_id = '${zone}'`);
    
    const whereClause = conditions.length > 0 ? `WHERE ` + conditions.join(' AND ') : '';

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COALESCE(empresa, 'Sin Empresa') as name,
        COUNT(*) as total_movimientos,
        COUNT(*) FILTER (WHERE fecha_hora_salida IS NULL) as ocupacion_actual
      FROM movimiento_vehiculo
      ${whereClause}
      GROUP BY 1
      ORDER BY total_movimientos DESC
      LIMIT 10
    `);
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
            // include: {
            //     // If there were an AuditLog table, we could include it here.
            //     // For now, we rely on the version and timestamps added.
            // }
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
 * Requerimiento: sume reservas actuales y medias históricas 
 * (promedio de entradas de los últimos 30 días para el mismo día de la semana).
 */
export async function getPredictiveForecast() {
    try {
        const now = new Date();
        
        // 1. Obtener medias históricas de los últimos 30 días por día de la semana
        const historicalStats = await prisma.$queryRaw<any[]>`
            SELECT 
                EXTRACT(DOW FROM fecha_hora_entrada) as dow,
                COUNT(*)::float / 4.0 as avg_entradas -- 30 días aprox 4 semanas
            FROM movimiento_vehiculo
            WHERE fecha_hora_entrada >= NOW() - INTERVAL '30 days'
            GROUP BY 1
        `;

        // 2. Obtener reservas actuales (para los próximos 3 días)
        const reservations = await prisma.reserva.findMany({
            where: {
                fecha_prevista: {
                    gte: now,
                    lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
                }
            }
        });

        const forecast = [];
        for (let i = 1; i <= 3; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);
            const dow = date.getDay();
            
            const dayStat = historicalStats.find(s => Number(s.dow) === dow);
            const avgEntradas = dayStat ? Math.round(Number(dayStat.avg_entradas)) : 0;
            
            const dayReservas = reservations.filter(r => 
                r.fecha_prevista.toDateString() === date.toDateString()
            ).length;

            forecast.push({
                fecha: date.toISOString().split('T')[0],
                reservas: dayReservas,
                media_historica: avgEntradas,
                estimacion_total: dayReservas + avgEntradas,
                impacto_esperado: (dayReservas + avgEntradas > 500) ? 'Alto' : 'Normal'
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
export async function getRealTimeStatusData(filterZone?: string) {
    try {
        const whereClause = filterZone && filterZone !== 'Todas' ? { id: filterZone } : {};
        const zones = await prisma.terminal_Zona.findMany({ where: whereClause });
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

/**
 * Snapshots: Crear snapshot manual
 */
export async function createManualSnapshotAction(terminal_id: string, ocupacion: number, notas?: string) {
    try {
        return await prisma.historico_Ocupacion_Snapshot.create({
            data: {
                terminal_id,
                ocupacion,
                manual: true,
                notas,
                fecha_hora: new Date()
            }
        });
    } catch (error) {
        console.error('Error creating manual snapshot:', error);
        throw error;
    }
}

/**
 * Snapshots: Actualizar snapshot
 */
export async function updateSnapshotAction(id: number, data: { ocupacion?: number; notas?: string }) {
    try {
        return await prisma.historico_Ocupacion_Snapshot.update({
            where: { id },
            data: {
                ...data,
                // manual: true // Podría ser opcional si queremos marcarlo como editado
            }
        });
    } catch (error) {
        console.error('Error updating snapshot:', error);
        throw error;
    }
}

/**
 * Reports: Iniciar informe asíncrono
 */
import { getReportQueue } from './queue/reports';

export async function startAsyncReportAction(type: string, params: any = {}) {
    const queue = await getReportQueue();
    const job = await queue.add(type, { type, params });
    return { jobId: job.id };
}


/**
 * Reports: Consultar estado de informe
 */
export async function getReportStatusAction(jobId: string) {
    const queue = await getReportQueue();
    const job = await queue.getJob(jobId);
    
    if (!job) return { status: 'not_found' };
    
    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    
    return {
        id: job.id,
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        result
    };
}

/**
 * Reports: Obtener tendencia detallada por terminales
 */
export async function getDetailedOccupancyTrendAction(scale: 'year' | 'month' | 'day' | 'hour', month?: number, year?: number, zone?: string) {
    return getOccupancyByTemporalScale(scale, month, year, zone, true);
}
