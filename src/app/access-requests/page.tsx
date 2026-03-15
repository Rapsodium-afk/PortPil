'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { readData, writeData } from '@/lib/actions';
import type { PedestrianAccessRequest } from '@/lib/types';
import { RequestForm } from './components/request-form';
import { RequestLog } from './components/request-log';
import { QrPrintDialog } from './components/qr-print-dialog';
import { useToast } from '@/hooks/use-toast';
import { createAccessRequest } from './access-actions';

export default function AccessRequestsPage() {
  const { user, activeCompany, isAdmin, isSoporteOperativo, isSoporteAduanas } = useAuth();
  const [requests, setRequests] = useState<PedestrianAccessRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PedestrianAccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PedestrianAccessRequest | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await readData<PedestrianAccessRequest[]>('access-requests.json');
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isAdmin || isSoporteOperativo || isSoporteAduanas) {
      setFilteredRequests(requests);
    } else if (activeCompany) {
      setFilteredRequests(requests.filter(r => r.companyId === activeCompany.id));
    } else {
      setFilteredRequests([]);
    }
  }, [requests, activeCompany, isAdmin, isSoporteOperativo, isSoporteAduanas]);

  const handleSubmit = async (values: any) => {
    if (!activeCompany) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes tener una empresa activa para realizar esta solicitud.'
      });
      return;
    }

    setIsSubmitting(true);
    
    // Generate custom ID: YYYYMMDDHHMMSS + last 4 of doc + last 4 of UTI
    const now = new Date();
    const isoString = now.toISOString();
    const timestamp = isoString.split('T')[0].replace(/-/g, '') + isoString.split('T')[1].split('.')[0].replace(/:/g, '');
    const numericDoc = values.documentNumber.replace(/\D/g, '');
    const docSuffix = numericDoc.slice(-4).padStart(4, numericDoc.slice(0, 4) || '0');
    const numericUti = values.uti.replace(/\D/g, '');
    const utiSuffix = numericUti.slice(-4).padStart(4, numericUti.slice(0, 4) || '0');
    
    // Fallback if no numbers in UTI or Doc (using last 4 original chars if numeric fails, but ideally numeric)
    const finalDocSuffix = docSuffix.length === 4 ? docSuffix : values.documentNumber.slice(-4).padStart(4, '0');
    const finalUtiSuffix = utiSuffix.length === 4 ? utiSuffix : values.uti.slice(-4).padStart(4, '0');
    
    const customId = `${timestamp}${finalDocSuffix}${finalUtiSuffix}`;

    const newRequest: PedestrianAccessRequest = {
      id: customId,
      ...values,
      companyId: activeCompany.id,
      companyName: activeCompany.name,
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedRequests = [newRequest, ...requests];
      await createAccessRequest(newRequest);
      setRequests(updatedRequests);
      setSelectedRequest(newRequest);
      setIsQrDialogOpen(true);
      toast({
        title: 'Solicitud creada',
        description: 'La solicitud de acceso se ha registrado correctamente.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la solicitud.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowQr = (request: PedestrianAccessRequest) => {
    setSelectedRequest(request);
    setIsQrDialogOpen(true);
  };

  if (isLoading) {
    return <div>Cargando solicitudes de acceso...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Acceso Conductores a Pie</h1>
        <p className="text-muted-foreground">
          Solicita y gestiona el acceso de conductores sin vehículo a la terminal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <RequestForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
        <div className="lg:col-span-2">
          <RequestLog requests={filteredRequests} onShowQr={handleShowQr} />
        </div>
      </div>

      <QrPrintDialog 
        request={selectedRequest} 
        isOpen={isQrDialogOpen} 
        onClose={() => setIsQrDialogOpen(false)} 
      />
    </div>
  );
}
