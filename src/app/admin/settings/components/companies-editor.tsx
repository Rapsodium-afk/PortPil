'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2, Edit, Building2, FileUp, FolderKanban } from 'lucide-react';
import type { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { readData, writeData } from '@/lib/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { bulkAddCompanies } from '../actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompanyDocumentsDialog } from './company-documents-dialog';

const companySchema = z.object({
  name: z.string().min(2, 'El nombre de la empresa es requerido.'),
  taxId: z.string().min(9, 'El CIF/NIF debe tener al menos 9 caracteres.'),
  accessControlId: z.string().min(1, 'El ID de Control de Acceso es requerido.'),
});

type CompanyFormValues = z.infer<typeof companySchema>;
type NewCompanyData = Omit<Company, 'id'>;


interface CompaniesEditorProps {
  initialCompanies: Company[];
  onUpdate: () => void;
}

export default function CompaniesEditor({ initialCompanies, onUpdate }: CompaniesEditorProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [bulkCsv, setBulkCsv] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { toast } = useToast();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
  });

  React.useEffect(() => {
    setCompanies(initialCompanies);
  }, [initialCompanies]);

  const handleOpenDialog = (company: Company | null = null) => {
    setEditingCompany(company);
    form.reset(company ? { name: company.name, taxId: company.taxId, accessControlId: company.accessControlId } : { name: '', taxId: '', accessControlId: '' });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CompanyFormValues) => {
    let updatedCompaniesList: Company[];
    
    if (editingCompany) {
        updatedCompaniesList = companies.map(c => c.id === editingCompany.id ? { ...c, ...data } : c);
    } else {
        const companyId = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newCompany: Company = { id: companyId, ...data };
        updatedCompaniesList = [...companies, newCompany];
    }
    
    await writeData('companies.json', updatedCompaniesList);
    setCompanies(updatedCompaniesList);
    toast({ title: editingCompany ? 'Empresa actualizada' : 'Empresa creada' });
    setIsDialogOpen(false);
  };
  
  const handleDelete = async (companyId: string) => {
    const updatedCompanies = companies.filter(c => c.id !== companyId);
    setCompanies(updatedCompanies);
    await writeData('companies.json', updatedCompanies);
    toast({ title: 'Empresa eliminada' });
  };

  const handleBulkImport = async () => {
    const lines = bulkCsv.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'No hay datos para importar.' });
        return;
    }

    const newCompanies: NewCompanyData[] = lines.map(line => {
        const [name, taxId, accessControlId] = line.split(',').map(item => item.trim());
        return { name, taxId, accessControlId };
    }).filter(c => c.name && c.taxId && c.accessControlId);

    if (newCompanies.length !== lines.length) {
        toast({ variant: 'destructive', title: 'Error de formato', description: 'Algunas líneas no tienen el formato correcto (Nombre,CIF,ID_Acceso) y han sido ignoradas.' });
        if (newCompanies.length === 0) return;
    }
    
    const result = await bulkAddCompanies(newCompanies);
    
    if (result.success) {
        toast({ title: 'Importación Completada', description: result.message });
        onUpdate();
        setIsBulkImportOpen(false);
        setBulkCsv('');
    } else {
        toast({ variant: 'destructive', title: 'Error en Importación', description: result.message });
    }
  };

  const openDocumentsDialog = (company: Company) => {
    setSelectedCompany(company);
    setIsDocumentsDialogOpen(true);
  };

  return (
    <>
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><Building2 className="mr-2"/>Gestión de Empresas</CardTitle>
            <CardDescription>
              Crea y gestiona las empresas clientes del sistema.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Importación Masiva
            </Button>
            <Button size="sm" onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre Empresa</TableHead>
                    <TableHead>CIF/NIF</TableHead>
                    <TableHead>ID Acceso</TableHead>
                    <TableHead>ID Interno</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {companies.map(company => (
                    <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.taxId}</TableCell>
                        <TableCell className="font-mono text-xs">{company.accessControlId}</TableCell>
                        <TableCell className="font-mono text-xs">{company.id}</TableCell>
                        <TableCell className="text-right">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => openDocumentsDialog(company)}>
                                        <FolderKanban className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Gestionar Expediente</p>
                                </TooltipContent>
                            </Tooltip>
                             <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(company)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </TooltipProvider>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
                <DialogDescription>
                    Rellena los datos de la empresa. El ID interno se generará automáticamente.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la Empresa</FormLabel>
                                <FormControl><Input {...field} placeholder="Mi Empresa S.L." /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CIF/NIF</FormLabel>
                                <FormControl><Input {...field} placeholder="B12345678" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="accessControlId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ID Control de Acceso</FormLabel>
                                <FormControl><Input {...field} placeholder="ID del otro sistema" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importación Masiva de Empresas</DialogTitle>
            <DialogDescription>
                Pega los datos en formato CSV (Nombre,CIF,ID_Acceso), una empresa por línea. Las comas en los nombres de empresa no están soportadas.
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            value={bulkCsv}
            onChange={(e) => setBulkCsv(e.target.value)}
            rows={10}
            placeholder={"Mi Empresa S.L.,B12345678,ME001\nOtra Empresa S.A.,A87654321,OE002"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulkImport}>Procesar Importación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompanyDocumentsDialog
        isOpen={isDocumentsDialogOpen}
        setIsOpen={setIsDocumentsDialogOpen}
        onUpdate={onUpdate}
        company={selectedCompany}
      />
    </>
  );
}
