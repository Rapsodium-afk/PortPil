import mysql from 'mysql2/promise';
import { readData } from './actions';
import type { SystemConfig } from './types';

let pool: mysql.Pool | null = null;

export async function getDbPool() {
  if (pool) return pool;

  const config = await readData<SystemConfig>('config.json');
  const dbConfig = config.dbConfig;

  if (!dbConfig || !dbConfig.dbHost) {
    throw new Error('La base de datos no está configurada.');
  }

  pool = mysql.createPool({
    host: dbConfig.dbHost,
    port: dbConfig.dbPort || 3306,
    user: dbConfig.dbUser,
    password: dbConfig.dbPassword,
    database: dbConfig.dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  return pool;
}

export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const dbPool = await getDbPool();
  const [rows] = await dbPool.execute(sql, params);
  return rows as T;
}

export async function testConnection(config: any): Promise<{ success: boolean; message: string }> {
  try {
    const connection = await mysql.createConnection({
      host: config.dbHost,
      port: config.dbPort || 3306,
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      connectTimeout: 5000
    });
    await connection.end();
    return { success: true, message: 'Conexión exitosa.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
