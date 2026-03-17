import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

export function getDatabaseUrl() {
  const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const db = config.traceabilityDbConfig;
      if (db && db.dbHost && db.dbUser && db.dbName) {
        return `postgresql://${db.dbUser}:${db.dbPassword}@${db.dbHost}:${db.dbPort || 5432}/${db.dbName}?schema=public&connect_timeout=60&socket_timeout=60&sslmode=disable`;
      }
    }
  } catch (error) {
    console.error('Error reading DB config from config.json:', error);
  }
  
  const envUrl = process.env.DATABASE_URL_TRACEABILITY || process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith('postgresql')) {
      return envUrl;
  }
  
  // Return a dummy but valid format URL to allow client initialization without crashing the whole app
  // Requests will still fail (and be caught by our try/catches in traceability.ts)
  return 'postgresql://localhost:5432/placeholder?schema=public&connect_timeout=60';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = getDatabaseUrl();
console.log('[Prisma] Initializing client. URL Protocol:', databaseUrl.split(':')[0]);

let prismaOptions: any = {
  log: ['query', 'info', 'warn', 'error'],
};

// Use Driver Adapter for PostgreSQL (Prisma 7 requirement)
if (databaseUrl && databaseUrl.startsWith('postgresql')) {
  console.log('[Prisma] Applying PostgreSQL Driver Adapter (No-SSL mode)');
  const pool = new Pool({ 
    connectionString: databaseUrl,
    connectionTimeoutMillis: 30000, 
    idleTimeoutMillis: 30000,
    max: 20,
    ssl: false // Force NO SSL at driver level
  });
  
  // Attach error handler to pool to prevent crashes
  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]', err);
  });

  const adapter = new PrismaPg(pool as any);
  prismaOptions.adapter = adapter;
}

export const prisma =
  globalForPrisma.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
