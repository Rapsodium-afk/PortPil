'use server';

import { z } from 'zod';
import { readData, writeData } from '@/lib/actions';
import type { User, UserRole, Company } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const registerableRoles: UserRole[] = ['Operador Logístico', 'Transitario', 'Agente de Aduanas'];

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  userType: z.enum(registerableRoles),
  companyName: z.string().min(2),
  taxId: z.string().min(9),
  attachments: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});

type RegisterPayload = z.infer<typeof registerSchema>;

export async function registerUser(data: RegisterPayload): Promise<{ success: boolean; message: string }> {
    try {
        const [users, companies] = await Promise.all([
            readData<User[]>('users.json'),
            readData<Company[]>('companies.json'),
        ]);

        const emailExists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (emailExists) {
            return { success: false, message: 'El correo electrónico ya está registrado.' };
        }
        
        let companyId: string;
        let existingCompany = companies.find(c => c.taxId.toLowerCase() === data.taxId.toLowerCase());

        if (existingCompany) {
            companyId = existingCompany.id;
        } else {
            companyId = data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const newCompany: Company = {
                id: companyId,
                name: data.companyName,
                taxId: data.taxId,
            };
            await writeData('companies.json', [...companies, newCompany]);
        }

        const newUser: User = {
            id: `user-${Date.now()}`,
            name: data.name,
            email: data.email,
            password: data.password, // In a real app, this should be hashed.
            roles: [data.userType],
            status: 'pending',
            companyIds: [companyId],
            registrationAttachments: data.attachments,
        };

        const updatedUsers = [...users, newUser];
        await writeData('users.json', updatedUsers);

        revalidatePath('/admin/users');
        revalidatePath('/admin/settings');

        return { success: true, message: 'Registro completado. Su cuenta está pendiente de validación por un administrador.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `Error en el servidor: ${message}` };
    }
}
