'use client';

import { useState, useEffect, useCallback } from 'react';
import { readData } from "@/lib/actions";
import type { Company } from "@/lib/types";
import CompaniesEditor from "../settings/components/companies-editor";

export default function CompaniesManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const companiesData = await readData<Company[]>('companies.json');
    setCompanies(companiesData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div>Cargando gestión de empresas...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
        <p className="text-muted-foreground">Administra las empresas logísticas y sus expedientes.</p>
      </div>
      <CompaniesEditor initialCompanies={companies} onUpdate={fetchData} />
    </div>
  );
}
