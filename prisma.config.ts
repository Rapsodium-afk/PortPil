import "dotenv/config";
import { defineConfig } from "prisma/config";
import fs from 'fs';
import path from 'path';

function getDatabaseUrl() {
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
    // Silent catch for CLI
  }
  
  const envUrl = process.env.DATABASE_URL_TRACEABILITY || process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith('postgresql')) {
      return envUrl;
  }
  
  return 'postgresql://localhost:5432/placeholder?schema=public';
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
