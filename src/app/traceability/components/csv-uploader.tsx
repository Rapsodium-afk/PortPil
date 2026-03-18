'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Upload, FileText, CheckCircle2, AlertCircle, 
    Loader2, X, ChevronRight, Settings2, Table as TableIcon,
    ArrowLeftRight, ListChecks
} from 'lucide-react';
import { importIncrementalCsvAction, ColumnMapping } from '@/lib/traceability';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { 
    Dialog, DialogContent, DialogDescription, 
    DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";

export function CSVUploader() {
    const [step, setStep] = useState<'upload' | 'mapping' | 'processing'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [delimiter, setDelimiter] = useState<string>(';');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({
        entrada: -1,
        salida: -1,
        matricula: -1,
        empresa: -1,
        zona: -1,
        posicion: -1,
        estado_aduanero: -1
    });
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [processedCount, setProcessedCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Reset when dialog closes
    useEffect(() => {
        if (!isOpen) resetWizard();
    }, [isOpen]);

    // Re-parse when delimiter changes
    useEffect(() => {
        if (file) {
            parseFile(file);
        }
    }, [delimiter]);

    const parseFile = async (currentFile: File) => {
        const text = await currentFile.text();
        const lines = text.split('\n');
        if (lines.length > 0) {
            const headers = lines[0].split(delimiter).map(h => h.trim());
            setCsvHeaders(headers);
            
            // Get first 3 data rows for preview
            const dataRows = lines.slice(1, 4)
                .filter(l => l.trim().length > 0)
                .map(l => l.split(delimiter).map(c => c.trim()));
            setPreviewRows(dataRows);

            // Auto-suggest mappings based on common names
            const newMapping = { ...mapping };
            headers.forEach((h, i) => {
                const low = h.toLowerCase();
                if (low.includes('entrada') || low.includes('entry') || low.includes('fecha')) newMapping.entrada = i;
                if (low.includes('salida') || low.includes('exit')) newMapping.salida = i;
                if (low.includes('matricula') || low.includes('plate') || low.includes('r')) newMapping.matricula = i;
                if (low.includes('empresa') || low.includes('company')) newMapping.empresa = i;
                if (low.includes('zona') || low === 'z' || low.includes('terminal')) newMapping.zona = i;
                if (low.includes('posicion') || low.includes('plaza') || low.includes('position')) newMapping.posicion = i;
                if (low.includes('aduana') || low.includes('customs') || low.includes('estado')) newMapping.estado_aduanero = i;
            });
            setMapping(newMapping);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile);
            await parseFile(selectedFile);
            setStep('mapping');
        } else {
            toast({
                title: "Formato no válido",
                description: "Por favor, selecciona un archivo CSV.",
                variant: "destructive"
            });
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        
        if (mapping.entrada === -1 || mapping.matricula === -1 || mapping.zona === -1) {
            toast({
                title: "Mapeo incompleto",
                description: "Los campos Entrada, Matrícula y Zona son obligatorios.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setStep('processing');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mapping', JSON.stringify(mapping));
            formData.append('delimiter', delimiter);

            const result = await importIncrementalCsvAction(formData);

            if (result.success) {
                setStatus('success');
                setProcessedCount(result.count || 0);
                toast({
                    title: "Carga completada",
                    description: `Se han importado ${result.count} movimientos correctamente.`,
                });
            } else {
                throw new Error(result.error || 'Error desconocido al importar.');
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message);
            toast({
                title: "Error en la carga",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const resetWizard = () => {
        setFile(null);
        setStep('upload');
        setStatus('idle');
        setMapping({ entrada: -1, salida: -1, matricula: -1, empresa: -1, zona: -1, posicion: -1, estado_aduanero: -1 });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="shadow-sm h-11 border-blue-200 hover:bg-blue-50 text-blue-700 font-bold">
                    <Upload className="mr-2 h-4 w-4" />
                    Carga CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-slate-900 text-white p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight">Importador Universal CSV</DialogTitle>
                            <DialogDescription className="text-blue-200/70 font-medium italic">Asistente de carga manual con mapeo dinámico</DialogDescription>
                        </div>
                    </div>
                </div>
                
                <div className="p-8 max-h-[80vh] overflow-y-auto">
                    {step === 'upload' && (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="group border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50"
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                            <div className="p-6 bg-slate-50 rounded-full mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                                <FileText className="h-12 w-12 text-slate-400 group-hover:text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Explorar archivos</h3>
                            <p className="text-sm text-slate-400 mt-2 text-center">Formato compatible: CSV (UTF-8)</p>
                        </div>
                    )}

                    {step === 'mapping' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Configuration Row */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-600 px-3 py-1">{file?.name}</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Separador:</label>
                                    <Select value={delimiter} onValueChange={setDelimiter}>
                                        <SelectTrigger className="w-[120px] h-8 text-xs bg-white border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=";">Punto y coma (;)</SelectItem>
                                            <SelectItem value=",">Coma (,)</SelectItem>
                                            <SelectItem value="\t">Tabulador (TSV)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TableIcon className="h-3 w-3" /> Previsualización de Datos
                                </h4>
                                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                {csvHeaders.map((h, i) => (
                                                    <TableHead key={i} className="text-[10px] font-bold text-slate-500 text-center border-r border-slate-100 last:border-0 min-w-[100px]">
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <span className="bg-slate-200 text-slate-600 w-5 h-5 rounded-full flex items-center justify-center text-[9px] mb-1">
                                                                {i + 1}
                                                            </span>
                                                            <span className="truncate max-w-[120px]">{h}</span>
                                                        </div>
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewRows.map((row, ri) => (
                                                <TableRow key={ri} className="h-10 hover:bg-slate-50 transition-colors">
                                                    {row.map((cell, ci) => (
                                                        <TableCell key={ci} className="text-[10px] text-slate-500 text-center border-r border-slate-100 last:border-0 italic truncate max-w-[120px]">
                                                            {cell || 'null'}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Mapping Wizard */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ArrowLeftRight className="h-3 w-3" /> Configuración de Columnas
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { id: 'matricula', label: 'Matrícula', required: true, icon: 'TRK' },
                                        { id: 'zona', label: 'ID Zona / Terminal', required: true, icon: 'MAP' },
                                        { id: 'entrada', label: 'Fecha de Entrada', required: true, icon: 'IN' },
                                        { id: 'salida', label: 'Fecha de Salida', required: false, icon: 'OUT' },
                                        { id: 'empresa', label: 'Nombre de Empresa', required: false, icon: 'CORP' },
                                        { id: 'posicion', label: 'Posición / Plaza', required: false, icon: 'POS' },
                                        { id: 'estado_aduanero', label: 'Estado Aduanero', required: false, icon: 'CUSTOMS' },
                                    ].map((field) => (
                                        <div key={field.id} className="p-4 rounded-xl bg-white border border-slate-100 hover:border-blue-200 transition-all shadow-sm flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700">
                                                    {field.label}
                                                    {field.required && <span className="text-rose-500 ml-1">*</span>}
                                                </label>
                                                <div className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                                                    {field.icon}
                                                </div>
                                            </div>
                                            <Select 
                                                value={mapping[field.id as keyof ColumnMapping].toString()} 
                                                onValueChange={(val) => setMapping(prev => ({ ...prev, [field.id]: parseInt(val) }))}
                                            >
                                                <SelectTrigger className="h-9 text-xs border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="-1" className="text-rose-500">-- No cargar --</SelectItem>
                                                    {csvHeaders.map((h, i) => (
                                                        <SelectItem key={i} value={i.toString()}>
                                                            <span className="font-bold text-blue-600 mr-2">[{i + 1}]</span>
                                                            {h}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {mapping[field.id as keyof ColumnMapping] !== -1 && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <ListChecks className="h-3 w-3 text-emerald-500" />
                                                    <span className="text-[10px] text-slate-400 italic truncate">
                                                        Ej: {previewRows[0]?.[mapping[field.id as keyof ColumnMapping]] || '---'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-slate-100">
                                <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold border-slate-200 hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                                    <X className="mr-2 h-4 w-4" /> Cancelar
                                </Button>
                                <Button className="flex-2 h-12 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" onClick={handleUpload}>
                                    Iniciar Carga Masiva <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-6">
                            {loading && (
                                <>
                                    <div className="h-24 w-24 relative flex items-center justify-center">
                                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                                        <Database className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg font-bold text-slate-900">Importando Registros...</h3>
                                        <p className="text-sm text-slate-500">Sincronizando con PostgreSQL y verificando zonas portuarias.</p>
                                    </div>
                                </>
                            )}

                            {status === 'success' && (
                                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">¡Operación Completada!</h3>
                                        <p className="text-slate-500">Se han añadido <strong>{processedCount}</strong> registros a la base de datos.</p>
                                    </div>
                                    <Button className="bg-slate-900 text-white rounded-2xl h-12 px-10 font-bold hover:scale-105 transition-transform" onClick={() => setIsOpen(false)}>
                                        Volver al Dashboard
                                    </Button>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
                                        <AlertCircle className="h-10 w-10 text-rose-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-slate-900">Error en la Carga</h3>
                                        <p className="text-sm text-rose-600 max-w-sm mx-auto bg-rose-50 p-4 rounded-xl border border-rose-100">{errorMessage}</p>
                                    </div>
                                    <Button className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-bold" onClick={() => setStep('mapping')}>
                                        Corregir Mapeo
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Database(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
        </svg>
    )
}
