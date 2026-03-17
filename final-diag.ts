import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function finalDiagnostic() {
    const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const db = config.traceabilityDbConfig;

    console.log('--- FINAL DIAGNOSTIC ---');
    console.log(`Testing with User: ${db.dbUser}, DB: ${db.dbName}, IP: ${db.dbHost}`);

    const client = new Client({
        host: db.dbHost,
        port: db.dbPort || 5450,
        user: db.dbUser,
        password: db.dbPassword,
        database: db.dbName,
        ssl: false,
        connectionTimeoutMillis: 30000
    });

    try {
        await client.connect();
        console.log('✅ SUCCESS!');
        await client.end();
    } catch (err: any) {
        console.log('❌ ERROR TYPE:', err.code);
        console.log('❌ ERROR MESSAGE:', err.message);
        if (err.detail) console.log('❌ DETAIL:', err.detail);
        await client.end().catch(() => {});
    }
}

finalDiagnostic();
