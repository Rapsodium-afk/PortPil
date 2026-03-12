'use server';

import { readData, writeData } from "@/lib/actions";
import type { SituationZone, OperatingStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

type UpdateZoneConfigPayload = {
  id: string;
  maxSpots: number;
  status: SituationZone['status'];
  operatingStatus: OperatingStatus;
  withStaff: boolean;
};

export async function updateZoneConfig(payload: UpdateZoneConfigPayload): Promise<{ success: boolean; message: string }> {
  try {
    const allZones = await readData<SituationZone[]>('situation.json');
    const zoneIndex = allZones.findIndex(z => z.id === payload.id);

    if (zoneIndex === -1) {
      return { success: false, message: 'Zona no encontrada.' };
    }

    allZones[zoneIndex] = {
      ...allZones[zoneIndex],
      maxSpots: payload.maxSpots,
      status: payload.status,
      operatingStatus: payload.operatingStatus,
      withStaff: payload.withStaff,
    };

    await writeData('situation.json', allZones);
    revalidatePath('/dashboard');
    revalidatePath('/');
    revalidatePath('/situacion');

    return { success: true, message: 'Configuración de la zona actualizada.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido.';
    return { success: false, message };
  }
}
