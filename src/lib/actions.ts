'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { query, testConnection } from './database';
import { getDatabaseUrl } from './prisma';
import type { SystemConfig, ModulePersistence, NewsPost, DatabaseConfig } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const dataPath = path.join(process.cwd(), 'src', 'data');

async function getFilePath(filename: string) {
    if (!/^[a-zA-Z0-9_-]+\.json$/.test(filename)) {
        throw new Error('Invalid filename');
    }
    return path.join(dataPath, filename);
}

export async function readData<T>(filename: string): Promise<T> {
    // Determine module from filename
    const module = filename.split('.')[0] as keyof ModulePersistence;
    const config = await readConfigOnly();
    const persistenceMode = config.modulePersistence?.[module] || 'json';

    if (persistenceMode === 'db') {
        return readFromDb<T>(module);
    }

    const filePath = await getFilePath(filename);
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return [] as T;
        }
        console.error(`Error reading ${filename}:`, error);
        throw new Error(`Could not read data from ${filename}`);
    }
}

export async function writeData(filename: string, data: any): Promise<void> {
    const module = filename.split('.')[0] as keyof ModulePersistence;
    const config = await readConfigOnly();
    const persistenceMode = config.modulePersistence?.[module] || 'json';

    if (persistenceMode === 'db') {
        await writeToDb(module, data);
    } else {
        const filePath = await getFilePath(filename);
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error(`Error writing to ${filename}:`, error);
            throw new Error(`Could not write data to ${filename}`);
        }
    }
    
    revalidatePath('/', 'layout');
}

// Utility to read config without triggering recursion
async function readConfigOnly(): Promise<SystemConfig> {
    const filePath = path.join(dataPath, 'config.json');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch {
        return {} as SystemConfig;
    }
}

async function readFromDb<T>(module: string): Promise<T> {
    switch (module) {
        case 'news':
            const rows = await query<any[]>('SELECT * FROM news ORDER BY createdAt DESC');
            return rows as T;
        case 'users':
            const users = await query<any[]>('SELECT * FROM users');
            // Parse roles and companyIds if they are stored as JSON strings
            return users.map(u => ({
                ...u,
                roles: typeof u.roles === 'string' ? JSON.parse(u.roles) : u.roles,
                companyIds: typeof u.companyIds === 'string' ? JSON.parse(u.companyIds) : u.companyIds
            })) as T;
        default:
            throw new Error(`DB Read not implemented for module: ${module}`);
    }
}

async function writeToDb(module: string, data: any): Promise<void> {
    switch (module) {
        case 'news':
            if (Array.isArray(data)) {
                for (const post of data) {
                    await query(
                        'INSERT INTO news (id, title, content, author, createdAt, imageUrl) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, content=?, author=?, imageUrl=?',
                        [post.id, post.title, post.content, post.author, post.createdAt, post.imageUrl, post.title, post.content, post.author, post.imageUrl]
                    );
                }
            }
            break;
        case 'users':
            if (Array.isArray(data)) {
                for (const user of data) {
                    await query(
                        'INSERT INTO users (id, name, email, roles, status, companyIds) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, roles=?, status=?, companyIds=?',
                        [user.id, user.name, user.email, JSON.stringify(user.roles), user.status, JSON.stringify(user.companyIds), user.name, JSON.stringify(user.roles), user.status, JSON.stringify(user.companyIds)]
                    );
                }
            }
            break;
        default:
            throw new Error(`DB Write not implemented for module: ${module}`);
    }
}

export async function testConnectionAction(config: DatabaseConfig) {
    return await testConnection(config);
}

export async function syncDataFromJsonToDbAction(module: string) {
    const filename = `${module}.json`;
    const filePath = await getFilePath(filename);
    
    // Force read from JSON file regardless of current persistence mode
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // Force write to DB regardless of current persistence mode
    await writeToDb(module, jsonData);
    
    return { success: true };
}

export async function readCss(): Promise<string> {
    const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
    try {
        return await fs.readFile(cssPath, 'utf-8');
    } catch (error) {
        console.error('Error reading globals.css:', error);
        throw new Error('Could not read globals.css');
    }
}

export async function writeCss(content: string): Promise<void> {
    const cssPath = path.join(process.cwd(), 'src', 'app', 'globals.css');
    try {
        await fs.writeFile(cssPath, content, 'utf-8');
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error('Error writing globals.css:', error);
        throw new Error('Could not write globals.css');
    }
}

export async function uploadFile(base64Data: string, fileName: string, type: 'images' | 'documents' | 'backups'): Promise<{url: string, path: string}> {
    const config = await readConfigOnly();
    // Default to a folder in public if not configured
    const defaultPaths = {
        images: path.join(process.cwd(), 'public', 'uploads', 'images'),
        documents: path.join(process.cwd(), 'public', 'uploads', 'documents'),
        backups: path.join(process.cwd(), 'public', 'uploads', 'backups')
    };

    const targetDir = config.storagePaths?.[type] || defaultPaths[type];
    
    try {
        await fs.mkdir(targetDir, { recursive: true });
    } catch (err) {
        // Directory exists or other error
    }

    const filePath = path.join(targetDir, fileName);
    const buffer = Buffer.from(base64Data, 'base64');
    
    await fs.writeFile(filePath, buffer);
    
    // We return a URL that we'll handle with a dynamic route to serve these files
    // regardless of where they are stored on the server/NAS.
    return {
        url: `/api/files?type=${type}&name=${encodeURIComponent(fileName)}`,
        path: filePath
    };
}

export async function deleteFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

import { seedFromCsv } from './seeder';

export async function initializeTraceabilityDbAction() {
  console.log('Starting Traceability DB Initialization via Robust Proxy...');
  try {
    const url = getDatabaseUrl();
    console.log('Database URL for init (masked):', url ? url.replace(/:[^@:]+@/, ':****@') : 'MISSING');

    // 1. Run the custom full-setup script which handles tables and CSV
    // This bypasses the Prisma CLI engine and uses native 'pg' driver which is more resilient to latency
    console.log('Running npx tsx full-setup.ts...');
    const { stdout, stderr } = await execAsync('npx tsx full-setup.ts', { timeout: 600000 }); // 10 min timeout
    
    console.log('Setup Output:', stdout);
    if (stderr && !stderr.includes('Warning')) {
        console.error('Setup Error:', stderr);
    }
    
    if (stdout.includes('FINISHED SUCCESSFULLY')) {
        const importedMatch = stdout.match(/Total processed: (\d+)/);
        const count = importedMatch ? importedMatch[1] : 'varios';
        return { success: true, message: `Base de datos inicializada e importada correctamente (${count} registros).` };
    } else {
        throw new Error('El script de configuración no terminó correctamente. Revisa los logs.');
    }
  } catch (error: any) {
    console.error('Failed to initialize database:', error);
    return { 
      success: false, 
      message: `Error de instalación: ${error.message || 'Error desconocido'}. La latencia de red con el servidor es demasiado alta o el archivo CSV no se encuentra.` 
    };
  }
}
export async function testTraceabilityConnectionAction(config: DatabaseConfig) {
  console.log('Testing PostgreSQL connection to:', config.dbHost, config.dbPort);
  try {
    const url = `postgresql://${config.dbUser}:${config.dbPassword}@${config.dbHost}:${config.dbPort || 5432}/${config.dbName}?schema=public&connect_timeout=60&socket_timeout=60&sslmode=disable`;
    
    // We create a temporary client to test this specific config
    const { PrismaClient } = await import('@prisma/client');
    const { Pool } = await import('pg');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    
    console.log('Attempting connect with URL (masked):', url.replace(/:[^@:]+@/, ':****@'));

    const startTime = Date.now();
    const pool = new Pool({ 
        connectionString: url, 
        connectionTimeoutMillis: 30000, // 30s
        ssl: false
    });
    
    const adapter = new PrismaPg(pool as any);
    const testPrisma = new PrismaClient({ adapter });
    
    // TEST: Actually execute a simple query, not just connect
    await testPrisma.$queryRaw`SELECT 1`;
    
    const duration = Date.now() - startTime;
    console.log(`PostgreSQL connection test: CONNECTED AND QUERIED in ${duration}ms`);
    await testPrisma.$disconnect();
    await pool.end();
    
    return { success: true, message: `Conexión con PostgreSQL exitosa (${duration}ms). El servidor responde a consultas.` };
  } catch (error: any) {
    console.error('PostgreSQL Test Connection failed:', error);
    return { 
      success: false, 
      message: `Error de conexión: ${error.message || 'Sin respuesta'}. El servidor tarda demasiado en responder (>30s) o la red es muy inestable.` 
    };
  }
}
