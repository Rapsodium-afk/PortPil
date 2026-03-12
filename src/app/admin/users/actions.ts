'use server';

import { readData, writeData } from '@/lib/actions';
import type { User } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function approveUser(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const users = await readData<User[]>('users.json');
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado.' };
        }

        if (users[userIndex].status === 'active') {
            return { success: false, message: 'El usuario ya está activo.' };
        }

        users[userIndex].status = 'active';

        await writeData('users.json', users);
        
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido al aprobar el usuario.';
        return { success: false, message };
    }
}
