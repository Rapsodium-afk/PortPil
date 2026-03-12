'use server';

import * as serverUtils from '@/lib/server-utils';

interface UtiApiResponse {
    TRAILER_PLATE: string | null;
    COMPANY: string | null;
    ENTRY_DATE: string | null;
    TRAILER_TYPE: string | null;
    STATUS: string | null;
    LOCATION: string | null;
    DAYS_IN_TERMINAL: number | null;
}

export async function getUtiDetails(plate: string): Promise<{ data?: UtiApiResponse[], error?: string }> {
    return serverUtils.getUtiDetailsFromServer(plate);
}
