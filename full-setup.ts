import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

async function fullSetup() {
    console.log('--- STARTING RESILIENT DATABASE SETUP ---');
    const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
    if (!fs.existsSync(configPath)) {
        console.error('Config file not found');
        return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const db = config.traceabilityDbConfig;
    
    const url = `postgresql://${db.dbUser}:${db.dbPassword}@${db.dbHost}:${db.dbPort || 5450}/${db.dbName}?schema=public&connect_timeout=60&socket_timeout=60&sslmode=disable`;
    console.log('Target database (masked):', url.replace(/:[^@:]+@/, ':****@'));

    const pool = new Pool({ 
        connectionString: url,
        connectionTimeoutMillis: 45000, // 45s for initial connection
        max: 5,
        ssl: false
    });

    let client;
    let retries = 3;
    while (retries > 0) {
        try {
            console.log(`Attempting connection (Retries left: ${retries})...`);
            client = await pool.connect();
            console.log('1. Connection established!');
            break;
        } catch (err: any) {
            console.error(`Connection failed: ${err.message}`);
            retries--;
            if (retries === 0) throw new Error('Could not connect after 3 attempts');
            console.log('Waiting 5s before retry...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    if (!client) return;

    try {
        // Create tables
        console.log('2. Syncing schema...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS terminal_zona (
                id VARCHAR(255) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                capacidad_maxima INTEGER NOT NULL,
                descripcion TEXT,
                activa BOOLEAN DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS movimiento_vehiculo (
                id SERIAL PRIMARY KEY,
                terminal_id VARCHAR(255) NOT NULL,
                matricula VARCHAR(255) NOT NULL,
                fecha_hora_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                fecha_hora_salida TIMESTAMP,
                tipo_vehiculo VARCHAR(255) NOT NULL,
                empresa VARCHAR(255)
            );

            CREATE TABLE IF NOT EXISTS historico_ocupacion_snapshot (
                id SERIAL PRIMARY KEY,
                terminal_id VARCHAR(255) NOT NULL,
                fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ocupacion INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_movimiento_terminal_entrada ON movimiento_vehiculo (terminal_id, fecha_hora_entrada);
            CREATE INDEX IF NOT EXISTS idx_movimiento_salida ON movimiento_vehiculo (fecha_hora_salida);
            CREATE INDEX IF NOT EXISTS idx_historico_terminal_fecha ON historico_ocupacion_snapshot (terminal_id, fecha_hora);
        `);

        // Check current data
        const { rows } = await client.query('SELECT COUNT(*) FROM movimiento_vehiculo');
        console.log(`3. Current records in DB: ${rows[0].count}`);

        const csvPath = path.join(process.cwd(), 'Copia de movimientos_2022  versionweb.csv');
        if (fs.existsSync(csvPath)) {
            console.log('4. CSV file found. Starting batched import...');
            const content = fs.readFileSync(csvPath, 'utf-8');
            const lines = content.split('\n');
            const header = lines[0].trim().split(';');
            
            const idx = {
                entrada: header.indexOf('fechaentrada'),
                salida: header.indexOf('fechasalida'),
                matricula: header.indexOf('matriculaR'),
                empresa: header.indexOf('empresa'),
                zona: header.indexOf('z')
            };

            const uniqueZones = new Set<string>();
            const BATCH_SIZE = 500;
            let batch = [];
            let totalProcessed = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const cols = line.split(';');
                if (cols.length < header.length) continue;

                const zona = cols[idx.zona] || 'AUTO_ZONE';
                uniqueZones.add(zona);
                
                const entrada = parseCsvDate(cols[idx.entrada]);
                const salida = cols[idx.salida] && cols[idx.salida] !== 'NULL' ? parseCsvDate(cols[idx.salida]) : null;

                batch.push([zona, cols[idx.matricula] || 'N/A', entrada, salida, 'CAMION', cols[idx.empresa] || 'N/A']);

                if (batch.length >= BATCH_SIZE) {
                    await insertBatchWithRetry(client, batch);
                    totalProcessed += batch.length;
                    console.log(`   Processed ${totalProcessed} records...`);
                    batch = [];
                }
            }

            if (batch.length > 0) {
                await insertBatchWithRetry(client, batch);
                totalProcessed += batch.length;
            }
            console.log(`\n5. Import finished. Total processed: ${totalProcessed}`);

            // Update Zones
            console.log('6. Finalizing zones...');
            for (const zoneId of uniqueZones) {
                await client.query(
                    'INSERT INTO terminal_zona (id, nombre, capacidad_maxima, activa) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                    [zoneId, `Terminal ${zoneId}`, 500, true]
                );
            }
        }

        console.log('--- SETUP FINISHED SUCCESSFULLY ---');
        client.release();
    } catch (err: any) {
        console.error('--- ABORTED DUE TO ERROR ---');
        console.error(err);
    } finally {
        await pool.end();
    }
}

async function insertBatchWithRetry(client: any, batch: any[][], retries = 2) {
    try {
        const values = [];
        const params = [];
        let counter = 1;
        for (const row of batch) {
            const rowPlaceholders = [];
            for (const col of row) {
                params.push(col);
                rowPlaceholders.push(`$${counter++}`);
            }
            values.push(`(${rowPlaceholders.join(',')})`);
        }
        const query = `INSERT INTO movimiento_vehiculo (terminal_id, matricula, fecha_hora_entrada, fecha_hora_salida, tipo_vehiculo, empresa) VALUES ${values.join(',')}`;
        await client.query(query, params);
    } catch (err) {
        if (retries > 0) {
            console.log(`   Batch failed, retrying (${retries} left)...`);
            await new Promise(r => setTimeout(r, 2000));
            return insertBatchWithRetry(client, batch, retries - 1);
        }
        throw err;
    }
}

function parseCsvDate(dateStr: string): Date {
  if (!dateStr || dateStr.trim() === 'NULL' || !dateStr.includes('/')) return new Date();
  const [datePart, timePart] = dateStr.trim().split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0];
  return new Date(year, month - 1, day, hours, minutes);
}

fullSetup();
