'use server';

import { readData, writeData } from "@/lib/actions";
import type { SituationZone, ZoneStatus, OperatingStatus, SystemConfig } from "@/lib/types";
import { revalidatePath } from "next/cache";

type UpdateSituationPayload = {
  id: string;
  freeSpots: number;
  status: ZoneStatus;
  operatingStatus: OperatingStatus;
  withStaff: boolean;
}[];

export async function updateSituation(payload: UpdateSituationPayload): Promise<{ success: boolean; message: string }> {
  try {
    const allZones = await readData<SituationZone[]>('situation.json');
    const now = new Date().toISOString();

    payload.forEach(update => {
        const zoneIndex = allZones.findIndex(z => z.id === update.id);
        if (zoneIndex !== -1) {
            allZones[zoneIndex].freeSpots = update.freeSpots;
            allZones[zoneIndex].status = update.status;
            allZones[zoneIndex].operatingStatus = update.operatingStatus;
            allZones[zoneIndex].withStaff = update.withStaff;
            allZones[zoneIndex].lastUpdated = now;
        }
    });

    await writeData('situation.json', allZones);
    revalidatePath('/dashboard');
    revalidatePath('/situacion');
    revalidatePath('/');

    return { success: true, message: 'Situación de zonas actualizada correctamente.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido.';
    return { success: false, message };
  }
}

export async function updateSituationInstructions(instructions: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = await readData<SystemConfig>('config.json');
    config.situationInstructions = instructions;
    await writeData('config.json', config);
    revalidatePath('/situacion');
    return { success: true, message: 'Instrucciones actualizadas correctamente.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido.';
    return { success: false, message };
  }
}
