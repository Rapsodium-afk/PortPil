'use client';

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { PedestrianAccessRequest } from '@/lib/types';

interface QrPrintDialogProps {
  request: PedestrianAccessRequest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QrPrintDialog({ request, isOpen, onClose }: QrPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!request) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Imprimir Pase de Acceso</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: sans-serif; padding: 40px; text-align: center; }
      .card { border: 2px solid #ccc; padding: 20px; border-radius: 10px; display: inline-block; }
      .header { border-bottom: 2px solid #eee; margin-bottom: 20px; padding-bottom: 10px; }
      .data { text-align: left; margin: 20px 0; }
      .data-row { margin-bottom: 8px; }
      .label { font-weight: bold; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `pase-acceso-${request.fullName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const qrData = JSON.stringify({
    id: request.id,
    doc: request.documentNumber,
    name: request.fullName,
    uti: request.uti,
    date: request.visitDate
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pase de Acceso Generado</DialogTitle>
          <DialogDescription>
            Este código QR deberá ser presentado en el control de acceso.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border my-4" ref={printRef}>
          <div className="text-center mb-4 hidden print:block">
            <h1 className="text-2xl font-bold">PortPilot v2</h1>
            <p className="text-sm">Pase de Acceso - Conductor a Pie</p>
          </div>

          <QRCodeCanvas 
            value={qrData} 
            size={256} 
            level="H" 
            includeMargin 
          />
          
          <div className="mt-6 text-center space-y-1 w-full max-w-xs">
            <p className="text-lg font-bold">{request.fullName}</p>
            <p className="text-sm text-muted-foreground">{request.documentNumber}</p>
            <div className="h-px bg-border my-2" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm w-full">
                <span className="font-semibold text-left">UTI:</span>
                <span className="text-right font-mono">{request.uti}</span>
                
                <span className="font-semibold text-left">Fecha:</span>
                <span className="text-right">
                  {(() => {
                    try {
                      const datePart = request.visitDate.split('T')[0];
                      const [year, month, day] = datePart.split('-').map(Number);
                      const dateObj = new Date(year, month - 1, day);
                      return format(dateObj, 'dd/MM/yyyy');
                    } catch (e) {
                      return request.visitDate;
                    }
                  })()}
                </span>
                
                <span className="font-semibold text-left">Empresa:</span>
                <span className="text-right truncate">{request.companyName}</span>
            </div>
            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] text-yellow-800 leading-tight text-center">
                <p className="font-bold mb-1 uppercase">Aviso de Seguridad</p>
                <p>Este pase permite el acceso 1 vez al día mientras la UTI se encuentre en la terminal. Una vez validado, quedará inoperativo para evitar duplicados.</p>
            </div>
            <div className="mt-2 text-[8px] text-muted-foreground font-mono text-center">
              ID: {request.id}
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
