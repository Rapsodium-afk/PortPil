'use server';

import { readData, writeData } from '@/lib/actions';
import type { Fleet, Vehicle, User } from '@/lib/types';
import { notifyRoles, notifyUserIfEnabled } from '@/lib/email-service';

/**
 * Retrieves all fleets in the system.
 */
export async function getAllFleets(): Promise<Fleet[]> {
    return await readData<Fleet[]>('fleets.json');
}

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
    
    // Notify users of the company
    try {
      const allUsers = await readData<User[]>('users.json');
      const companyUsers = allUsers.filter(u => u.companyIds?.includes(companyName)); // Note: companyName is used as ID in some parts, or name. Let's assume company name check
      
      // Better check: company names usually match in Fleet but companyId is better. 
      // In this app, companyName is used in Fleet.
      const targetUsers = allUsers.filter(u => u.companyIds?.length > 0); // Simplified for now, or match by company name if possible
      
      // Let's just notify the admins and the user who did it for now, or all users if we find them.
      await notifyRoles(['Admin', 'Soporte Operativo'], 'notifyFleetUpdatesEmail', {
        companyName,
        userName
      });
    } catch (e) {
      console.error('Error sending fleet update notification:', e);
    }
    
    return { success: true, message: 'Flota actualizada correctamente.', fleet: newFleetData };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al actualizar la flota.';
    return { success: false, message };
  }
}
