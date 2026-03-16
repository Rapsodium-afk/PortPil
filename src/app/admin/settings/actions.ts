'use server';

import { readData, writeData } from '@/lib/actions';
import type { Company, ImagePlaceholder } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// This is the data structure we expect from the client after parsing the CSV
type NewCompanyData = Omit<Company, 'id'>;

export async function bulkAddCompanies(
    newCompaniesData: NewCompanyData[]
): Promise<{ success: boolean; message: string; }> {
  try {
    const existingCompanies = await readData<Company[]>('companies.json');
    const existingTaxIds = new Set(existingCompanies.map(c => c.taxId.toLowerCase()));
    const existingAccessIds = new Set(existingCompanies.map(c => c.accessControlId?.toLowerCase()).filter((id): id is string => !!id));

    const companiesToAdd: Company[] = [];

    for (const companyData of newCompaniesData) {
      if (existingTaxIds.has(companyData.taxId.toLowerCase())) {
        console.warn(`Skipping company with duplicate Tax ID: ${companyData.taxId}`);
        continue; // Skip duplicates
      }
       if (companyData.accessControlId && existingAccessIds.has(companyData.accessControlId.toLowerCase())) {
        console.warn(`Skipping company with duplicate Access Control ID: ${companyData.accessControlId}`);
        continue; // Skip duplicates
      }

      const newCompany: Company = {
        ...companyData,
        id: companyData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      };
      
      // Ensure generated ID is unique as well
      let finalId = newCompany.id;
      let counter = 1;
      while (existingCompanies.some(c => c.id === finalId) || companiesToAdd.some(c => c.id === finalId)) {
        finalId = `${newCompany.id}-${counter}`;
        counter++;
      }
      newCompany.id = finalId;

      companiesToAdd.push(newCompany);
      existingTaxIds.add(newCompany.taxId.toLowerCase());
      if (newCompany.accessControlId) {
        existingAccessIds.add(newCompany.accessControlId.toLowerCase());
      }
    }

    if (companiesToAdd.length === 0) {
        return { success: true, message: 'No se añadieron nuevas empresas. Puede que ya existieran.' };
    }

    const updatedCompanies = [...existingCompanies, ...companiesToAdd];
    await writeData('companies.json', updatedCompanies);
    
    revalidatePath('/admin/settings');

    return { success: true, message: `Se añadieron ${companiesToAdd.length} nuevas empresas.` };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido durante la importación masiva.';
    return { success: false, message };
  }
}


export async function addCompanyExpedienteFiles(
  companyId: string,
  files: { name: string; url: string }[],
  uploaderName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const companies = await readData<Company[]>('companies.json');
    const companyIndex = companies.findIndex(c => c.id === companyId);

    if (companyIndex === -1) {
      return { success: false, message: 'Empresa no encontrada.' };
    }

    const newFiles = files.map(file => ({
      ...file,
      uploadedBy: uploaderName,
      createdAt: new Date().toISOString(),
    }));

    if (!companies[companyIndex].expedienteFiles) {
      companies[companyIndex].expedienteFiles = [];
    }

    companies[companyIndex].expedienteFiles!.push(...newFiles);

    await writeData('companies.json', companies);
    
    revalidatePath('/admin/settings');
    revalidatePath('/expediente');

    return { success: true, message: 'Documentos subidos correctamente.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al subir documentos.';
    return { success: false, message };
  }
}

export async function addPlaceholderImage(
    formData: FormData
): Promise<{ success: boolean; message: string; }> {
    try {
        const description = formData.get('description') as string;
        const file = formData.get('image') as File | null;

        if (!description || !file || file.size === 0) {
            return { success: false, message: 'La descripción y la imagen son obligatorias.' };
        }

        let data = await readData<any>('placeholder-images.json');
        
        if (Array.isArray(data) || !data) {
            data = { placeholderImages: [] };
        } else if (!data.placeholderImages) {
            data.placeholderImages = [];
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hero');
        
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);

        const imageUrl = `/uploads/hero/${filename}`;

        const newImage: ImagePlaceholder = {
            id: `img-${Date.now()}`,
            description: description,
            imageUrl: imageUrl,
        };
        
        data.placeholderImages.push(newImage);
        
        await writeData('placeholder-images.json', data);
        
        revalidatePath('/admin/settings');
        revalidatePath('/');

        return { success: true, message: 'Imagen añadida correctamente.' };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido al añadir la imagen.';
        return { success: false, message };
    }
}
