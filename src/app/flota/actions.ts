'use server';

import { readData, writeData } from '@/lib/actions';
import type { Fleet, Vehicle } from '@/lib/types';

/**
 * Retrieves the fleet for a specific company.
 * If no fleet exists, it creates an empty one.
 */
export async function getFleetByCompany(companyName: string): Promise<Fleet> {
  const allFleets = await readData<Fleet[]>('fleets.json');
  let companyFleet = allFleets.find(f => f.companyName === companyName);

  if (!companyFleet) {
    companyFleet = { companyName, vehicles: [] };
  }
  
  return companyFleet;
}

/**
 * Updates the entire list of vehicles for a company's fleet.
 */
export async function updateFleet(
  companyName: string, 
  updatedVehicles: Vehicle[],
  userName: string
): Promise<{ success: boolean; message: string; fleet?: Fleet; }> {
  try {
    const allFleets = await readData<Fleet[]>('fleets.json');
    const fleetIndex = allFleets.findIndex(f => f.companyName === companyName);
    
    const newFleetData: Fleet = {
      companyName,
      vehicles: updatedVehicles,
    };

    if (fleetIndex !== -1) {
      allFleets[fleetIndex] = newFleetData;
    } else {
      allFleets.push(newFleetData);
    }
    
    await writeData('fleets.json', allFleets);
    
    return { success: true, message: 'Flota actualizada correctamente.', fleet: newFleetData };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al actualizar la flota.';
    return { success: false, message };
  }
}
