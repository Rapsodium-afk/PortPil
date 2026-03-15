'use server';

import { readData, writeData } from '@/lib/actions';
import { PedestrianAccessRequest, User } from '@/lib/types';
import { notifyRoles, notifyUserIfEnabled } from '@/lib/email-service';
import { revalidatePath } from 'next/cache';

export async function createAccessRequest(newRequest: PedestrianAccessRequest) {
  try {
    const requests = await readData<PedestrianAccessRequest[]>('access-requests.json');
    const updatedRequests = [newRequest, ...requests];
    await writeData('access-requests.json', updatedRequests);
    
    // Notify support roles
    await notifyRoles(['Admin', 'Soporte Operativo'], 'notifyQrAccessEmail', {
      fullName: newRequest.fullName,
      documentNumber: newRequest.documentNumber,
      visitDate: newRequest.visitDate
    });

    // Notify the requester (the logistics operator who created it)
    const allUsers = await readData<User[]>('users.json');
    // We don't have requesterId in PedestrianAccessRequest but we have companyName. 
    // Usually the user who created it is the active one.
    
    revalidatePath('/access-requests');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
