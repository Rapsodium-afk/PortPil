import fs from 'fs/promises';
import path from 'path';
import { prisma } from './prisma';

export async function seedFromCsv(csvPath: string) {
  console.log('Starting seed from CSV:', csvPath);
  
  try {
    const content = await fs.readFile(csvPath, 'utf-8');
    const lines = content.split('\n');
    const header = lines[0].trim().split(';');
    
    // index mapping
    const idx = {
      entrada: header.indexOf('fechaentrada'),
      salida: header.indexOf('fechasalida'),
      matricula: header.indexOf('matriculaR'),
      empresa: header.indexOf('empresa'),
      zona: header.indexOf('z')
    };

    const movements = [];
    const uniqueZones = new Set<string>();

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(';');
      if (cols.length < header.length) continue;

      const entradaStr = cols[idx.entrada];
      const salidaStr = cols[idx.salida];
      const matricula = cols[idx.matricula];
      const empresa = cols[idx.empresa];
      const zona = cols[idx.zona] || 'AUTO_ZONE';

      uniqueZones.add(zona);

      const entrada = parseCsvDate(entradaStr);
      const salida = salidaStr ? parseCsvDate(salidaStr) : null;

      movements.push({
        terminal_id: zona,
        fecha_hora_entrada: entrada,
        fecha_hora_salida: salida,
        matricula: matricula || 'Unknown',
        tipo_vehiculo: 'CAMION',
        empresa: empresa || 'N/A'
      });
      
      // Seed in batches of 1000 to avoid memory issues
      if (movements.length >= 1000) {
        await flushBatch(movements, uniqueZones);
        movements.length = 0;
      }
    }

    // Final flush
    if (movements.length > 0) {
      await flushBatch(movements, uniqueZones);
    }

    console.log('Seeding completed successfully');
    return { success: true, count: lines.length - 1 };
  } catch (error: any) {
    console.error('Error in CSV seeding:', error);
    throw error;
  }
}

function parseCsvDate(dateStr: string): Date {
  if (!dateStr || dateStr === 'NULL') return new Date();
  // Format: DD/MM/YYYY HH:mm
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0];
  return new Date(year, month - 1, day, hours, minutes);
}

async function flushBatch(movements: any[], zones: Set<string>) {
  // Ensure zones exist
  for (const zoneId of zones) {
    await prisma.terminal_Zona.upsert({
      where: { id: zoneId },
      update: {},
      create: {
        id: zoneId,
        nombre: `Terminal ${zoneId}`,
        capacidad_maxima: 500,
        activa: true
      }
    });
  }

  // Insert movements
  await prisma.movimiento_Vehiculo.createMany({
    data: movements,
    skipDuplicates: true
  });
}
