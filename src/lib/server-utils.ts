'use server';

import path from 'path';
import fs from 'fs/promises';
import type { SystemConfig } from '@/lib/types';

// This is a temporary workaround for development environments where the API might have a self-signed certificate.
// In a production environment, you should ensure the certificate is trusted.
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

interface UtiApiResponse {
    TRAILER_PLATE: string | null;
    COMPANY: string | null;
    ENTRY_DATE: string | null;
    TRAILER_TYPE: string | null;
    STATUS: string | null;
    LOCATION: string | null;
    DAYS_IN_TERMINAL: number | null;
}

async function getApiConfig(): Promise<{ config?: SystemConfig; error?: string; }> {
    const CONFIG_PATH = path.join(process.cwd(), 'src/data', 'config.json');
    try {
        const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
        return { config: JSON.parse(fileContent) };
    } catch (error: any) {
        return { error: `Error reading API config: ${error.message}` };
    }
}

/**
 * Realiza la consulta a la API de UTI para obtener información de un vehículo.
 * @param plate Matrícula a consultar.
 */
export async function getUtiDetailsFromServer(plate: string): Promise<{ data?: UtiApiResponse[]; error?: string }> {
    const { config, error: configError } = await getApiConfig();
    if (configError || !config?.utiApiToken) {
        return { error: configError || 'El token de la API de UTI no está configurado.' };
    }

    const url = `https://headoffice.ttpcontinentalparking.com:64443/api/trailerTrack/apiKeyfindByPlate?plate=${plate}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `JWT ${config.utiApiToken}`
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return { data };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió al conectar con el servicio de matrículas.';
        return { error: errorMessage };
    }
}
