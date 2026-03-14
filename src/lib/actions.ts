'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { query, testConnection } from './database';
import type { SystemConfig, ModulePersistence, NewsPost, DatabaseConfig } from './types';

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
