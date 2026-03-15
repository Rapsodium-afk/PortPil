'use server';

import { readData, writeData } from '@/lib/actions';
import { CauRequest, User } from '@/lib/types';
import { notifyRoles, notifyUserIfEnabled } from '@/lib/email-service';
import { revalidatePath } from 'next/cache';

export async function createCauRequest(newRequest: CauRequest) {
  try {
    // Check for expired requests first
    await checkAndExpireRequests();

    const requests = await readData<CauRequest[]>('cau-requests.json');
    const updatedRequests = [newRequest, ...requests];
    await writeData('cau-requests.json', updatedRequests);
    
    // Notify support roles
    await notifyRoles(['Admin', 'Soporte'], 'notifyCauEmail', {
      userName: newRequest.userName,
      subject: newRequest.subject,
      category: newRequest.category
    });

    revalidatePath('/cau');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateCauRequests(updatedRequests: CauRequest[]) {
  try {
    await writeData('cau-requests.json', updatedRequests);
    
    // Logic to notify if a new message was added by support
    // (This would require comparing with old state, but for now we can trigger it in handleReply)
    
    revalidatePath('/cau');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function sendCauReplyNotification(request: CauRequest, message: string, author: string) {
  try {
    const allUsers = await readData<User[]>('users.json');
    const requester = allUsers.find(u => u.id === request.userId || u.name === request.userName);
    
    if (requester) {
      await notifyUserIfEnabled(requester, 'notifyCauReplyEmail', {
        userName: request.userName,
        author,
        subject: request.subject,
        message
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function checkAndExpireRequests() {
  try {
    const requests = await readData<CauRequest[]>('cau-requests.json');
    const rolesData = await readData<any[]>('roles.json');
    const staffRoles = rolesData?.filter(r => r.type === 'Staff').map(r => r.id) || ['Admin', 'Soporte', 'Media Manager'];
    
    const now = new Date();
    let madeChanges = false;
    
    const updatedRequests = requests.map(req => {
      // Only check requests that are not already closed/archived/caducada
      if (['Archivada', 'Cerrada', 'Caducada', 'Aprobado', 'Denegado', 'No autorizado'].includes(req.status)) {
        return req;
      }

      if (req.history.length === 0) return req;

      const lastMessage = req.history[req.history.length - 1];
      
      // If the last person to reply was staff
      if (staffRoles.includes(lastMessage.authorRole)) {
        const lastActivityDate = new Date(lastMessage.createdAt);
        const hoursSinceLastActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastActivity >= 72) {
          madeChanges = true;
          return {
            ...req,
            status: 'Caducada',
            history: [
              ...req.history,
              {
                id: `msg-system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                author: 'Sistema',
                authorRole: 'Sistema',
                content: 'La solicitud ha sido cerrada automáticamente por falta de actividad del usuario en las últimas 72 horas.',
                createdAt: now.toISOString()
              }
            ]
          };
        }
      }
      return req;
    });

    if (madeChanges) {
      await writeData('cau-requests.json', updatedRequests);
      revalidatePath('/cau');
    }
    
    return { success: true, madeChanges };
  } catch (error) {
    console.error('Error checking expired requests:', error);
    return { success: false, error: String(error) };
  }
}
