'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const dataPath = path.join(process.cwd(), 'src', 'data');

async function getFilePath(filename: string) {
    if (!/^[a-zA-Z0-9_-]+\.json$/.test(filename)) {
        throw new Error('Invalid filename');
    }
    return path.join(dataPath, filename);
}

export async function readData<T>(filename: string): Promise<T> {
    const filePath = await getFilePath(filename);
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If file doesn't exist, we can assume it's an empty array.
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return [] as T;
        }
        console.error(`Error reading ${filename}:`, error);
        throw new Error(`Could not read data from ${filename}`);
    }
}

export async function writeData(filename: string, data: any): Promise<void> {
    const filePath = await getFilePath(filename);
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        // Revalidate all paths to ensure fresh data is fetched
        revalidatePath('/', 'layout');
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
        throw new Error(`Could not write data to ${filename}`);
    }
}
