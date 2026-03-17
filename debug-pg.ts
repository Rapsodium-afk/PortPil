import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function runTests() {
    const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const db = config.traceabilityDbConfig;

    const baseConfig = {
        host: db.dbHost,
        port: db.dbPort || 5450,
        user: db.dbUser,
        password: db.dbPassword,
        database: db.dbName,
        connectionTimeoutMillis: 60000 // 60s
    };

    const scenarios = [
        { name: 'Scenario A: ssl: false', options: { ...baseConfig, ssl: false } },
        { name: 'Scenario B: ssl: { rejectUnauthorized: false }', options: { ...baseConfig, ssl: { rejectUnauthorized: false } } },
        { name: 'Scenario C: ssl: undefined', options: { ...baseConfig } },
    ];

    for (const scenario of scenarios) {
        console.log(`\n--- STARTING: ${scenario.name} ---`);
        const client = new Client(scenario.options);
        const startTime = Date.now();
        try {
            await client.connect();
            const duration = Date.now() - startTime;
            console.log(`SUCCESS: Connected in ${duration}ms`);
            const res = await client.query('SELECT current_database(), current_user, version()');
            console.log('DB Info:', res.rows[0]);
            await client.end();
            console.log(`RESULT: ${scenario.name} PASSED ✅`);
            break; // Stop if we find one that works
        } catch (err: any) {
            const duration = Date.now() - startTime;
            console.error(`FAILED in ${duration}ms:`, err.message);
            if (err.stack) console.error(err.stack);
            try { await client.end(); } catch(e) {}
        }
    }
}

runTests();
