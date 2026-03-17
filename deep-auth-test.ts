import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function runTests() {
    console.log('--- DEEP AUTH TEST ---');
    const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const db = config.traceabilityDbConfig;

    const scenarios = [
        { name: 'SSL Required (rejectUnauthorized: false)', ssl: { rejectUnauthorized: false } },
        { name: 'SSL Preferred', ssl: true },
        { name: 'No SSL (Explicit false)', ssl: false },
    ];

    for (const scenario of scenarios) {
        console.log(`\nTesting ${scenario.name}...`);
        const client = new Client({
            host: db.dbHost,
            port: db.dbPort || 5450,
            user: db.dbUser,
            password: db.dbPassword,
            database: db.dbName,
            ssl: scenario.ssl,
            connectionTimeoutMillis: 30000 
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS: Connected with ${scenario.name}`);
            await client.end();
            return;
        } catch (err: any) {
            console.log(`❌ FAILED: ${err.message}`);
            try { await client.end(); } catch(e) {}
        }
    }

    console.log('\n--- CONCLUSION ---');
    console.log('If all failed with "no pg_hba.conf entry", the server explicitly blocks the IP 212.170.207.65 for all encryption modes.');
}

runTests();
