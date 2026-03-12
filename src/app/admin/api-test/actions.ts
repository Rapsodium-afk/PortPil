'use server';

import { getUtiDetailsFromServer } from "@/lib/server-utils";

/**
 * Server action to be used only by the API test page.
 * It directly returns the raw response from the server utility function.
 * @param plate The license plate to query.
 * @returns A promise that resolves to the raw response object, which contains either a 'data' or 'error' key.
 */
export async function testUtiApi(plate: string): Promise<{ data?: any; error?: string }> {
    return getUtiDetailsFromServer(plate);
}
