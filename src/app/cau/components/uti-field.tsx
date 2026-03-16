'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { getUtiDetails } from '../actions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole, UtiDetails } from '@/lib/types';

interface UtiFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidationResult: (isValid: boolean, details: UtiDetails | null) => void;
}

export function UtiField({ value, onChange, onValidationResult }: UtiFieldProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<UtiDetails | null>(null);
  const { user } = useAuth();

  const handleSearch = useCallback(async () => {
    if (!value) {
      setError('Por favor, introduce una matrícula.');
      onValidationResult(false, null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setDetails(null);
    onValidationResult(false, null);

    try {
      const response = await getUtiDetails(value);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      interface UtiApiResponse {
        TRAILER_PLATE?: string;
        plate?: string;
        COMPANY?: string;
        companyName?: string;
        ENTRY_DATE?: string;
        entranceDate?: string;
        STATUS?: string;
        state?: string;
        LOCATION?: string;
        zone?: string;
        DAYS_IN_TERMINAL?: number;
        duration?: string;
      }
      
      const data = response.data?.[0] as UtiApiResponse;

      if (!data || !(data.TRAILER_PLATE || data.plate)) {
        throw new Error('La matrícula no es válida o no se encontraron datos asociados.');
      }
      
      const status = data.STATUS || data.state;
      if (status !== 'INSIDE') {
        throw new Error(`La matrícula es válida, pero el vehículo no se encuentra dentro de la terminal (Estado: ${status}).`);
      }
      
      const mappedDetails: UtiDetails = {
        plate: data.TRAILER_PLATE || data.plate || '',
        companyName: data.COMPANY || data.companyName || null,
        entranceDate: data.ENTRY_DATE || data.entranceDate || null,
        state: status || null,
        zone: data.LOCATION || data.zone || null,
        duration: data.DAYS_IN_TERMINAL !== undefined && data.DAYS_IN_TERMINAL !== null ? `${data.DAYS_IN_TERMINAL} días` : (data.duration || null),
      };

      setDetails(mappedDetails);
      onValidationResult(true, mappedDetails);
      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ha ocurrido un error desconocido.';
      setError(errorMessage);
      setDetails(null);
      onValidationResult(false, null);
    } finally {
      setIsLoading(false);
    }
  }, [value, onValidationResult]);

  const canViewDetails = user?.roles.includes('Admin') || user?.roles.includes('Soporte Operativo') || user?.roles.includes('Soporte Aduanas');

  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel>Matrícula UTI <span className="text-destructive">*</span></FormLabel>
        <div className="flex gap-2">
          <FormControl>
            <Input 
              placeholder="Introducir matrícula" 
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setDetails(null);
                setError(null);
                onValidationResult(false, null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </FormControl>
          <Button type="button" onClick={handleSearch} disabled={isLoading || !value}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
            <span className="ml-2 hidden sm:inline">Validar UTI</span>
          </Button>
        </div>
      </FormItem>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Validación</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {details && !error && (
         <Alert variant="default" className="border-green-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Matrícula Validada Correctamente</AlertTitle>
          {canViewDetails && (
            <AlertDescription>
               <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                  <p><strong>Matrícula:</strong> {details.plate}</p>
                  <p><strong>Empresa:</strong> {details.companyName || 'No disponible'}</p>
                  <p><strong>Fecha Entrada:</strong> {details.entranceDate}</p>
                  <div className="flex items-center gap-1"><strong>Estado:</strong> <Badge variant="outline">{details.state}</Badge></div>
                  <p><strong>Ubicación:</strong> {details.zone}</p>
                  <p><strong>Duración:</strong> {details.duration}</p>
              </div>
            </AlertDescription>
          )}
        </Alert>
      )}
    </div>
  );
}
