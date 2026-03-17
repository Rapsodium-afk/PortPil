import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

function getUrl() {
    const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const db = config.traceabilityDbConfig;
        if (db && db.dbHost) {
            return `postgresql://${db.dbUser}:${db.dbPassword}@${db.dbHost}:${db.dbPort || 5432}/${db.dbName}?sslmode=disable`;
        }
    }
    return process.env.DATABASE_URL_TRACEABILITY || process.env.DATABASE_URL;
}

async function checkSchema() {
    const url = getUrl();
    const client = new Client({ connectionString: url });
    await client.connect();
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'terminal_zona'`);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

checkSchema().catch(console.error);
