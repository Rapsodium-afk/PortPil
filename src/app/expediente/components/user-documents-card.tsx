'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText, FolderArchive } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Company } from '@/lib/types';

interface UserDocumentsCardProps {
    company: Company | null;
}

export default function UserDocumentsCard({ company }: UserDocumentsCardProps) {
    const files = company?.expedienteFiles || [];
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FolderArchive />
                    Expediente de {company?.name || 'la Empresa'}
                </CardTitle>
                <CardDescription>
                    Archivos y documentos importantes subidos por nuestro equipo para tu empresa.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                        {files.length > 0 ? files.map((file, index) => (
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
                                    La empresa no tiene documentos en su expediente.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
