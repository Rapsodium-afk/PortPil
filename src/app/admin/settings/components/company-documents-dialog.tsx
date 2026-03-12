'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Company } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { addCompanyExpedienteFiles } from '../actions';
import FileUploadInput from '@/app/cau/components/file-upload-input';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CompanyDocumentsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onUpdate: () => void;
  company: Company | null;
}

export function CompanyDocumentsDialog({ isOpen, setIsOpen, onUpdate, company }: CompanyDocumentsDialogProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!company || !currentUser || filesToUpload.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes seleccionar una empresa y al menos un archivo.',
      });
      return;
    }

    setIsLoading(true);

    const payload = filesToUpload.map(file => ({
      name: file.name,
      url: '#', // Placeholder URL
    }));

    const result = await addCompanyExpedienteFiles(company.id, payload, currentUser.name);
    
    if (result.success) {
      toast({
        title: 'Documentos subidos',
        description: `Se han añadido ${filesToUpload.length} documentos al expediente de ${company.name}.`,
      });
      setFilesToUpload([]);
      onUpdate();
      setIsOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al subir',
        description: result.message,
      });
    }
    setIsLoading(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setFilesToUpload([]);
      }, 300)
    }
    setIsOpen(open);
  }

  const companyFiles = company?.expedienteFiles || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gestionar Expediente de {company?.name}</DialogTitle>
          <DialogDescription>
            Añade nuevos documentos al expediente de la empresa. Estos archivos serán visibles en su sección "Mi Expediente".
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-lg font-medium mb-2">Documentos Actuales</h3>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre del Archivo</TableHead>
                            <TableHead>Subido por</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companyFiles.length > 0 ? companyFiles.map((file, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {file.name}
                                </TableCell>
                                <TableCell>{file.uploadedBy}</TableCell>
                                <TableCell>
                                    {format(new Date(file.createdAt), 'dd MMMM yyyy', { locale: es })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={file.url} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Descargar
                                        </a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    Esta empresa no tiene documentos en su expediente.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </div>
          
          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Subir Nuevos Documentos</h3>
             <FileUploadInput
                value={filesToUpload}
                onValueChange={setFilesToUpload}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={isLoading || filesToUpload.length === 0}>
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar Documentos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
