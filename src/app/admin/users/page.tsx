'use client';
import { useAuth } from "@/hooks/use-auth";
import UsersTable from "./components/users-table";
import { useToast } from "@/hooks/use-toast";
import { approveUser as approveUserAction } from "./actions";
import { useEffect, useState } from "react";
import type { Company } from "@/lib/types";
import { readData } from "@/lib/actions";

export default function AdminUsersPage() {
  const { users, setUsers, isLoading, fetchAllUsers } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchCompanies() {
        const companiesData = await readData<Company[]>('companies.json');
        setCompanies(companiesData);
    }
    fetchCompanies();
  }, []);
  
  if (isLoading) return <div>Cargando...</div>;

  const handleApproveUser = async (userId: string) => {
    const result = await approveUserAction(userId);
    if (result.success) {
      await fetchAllUsers(); // Refetch all users to get the updated list
      toast({ title: "Usuario aprobado", description: "El usuario ahora tiene acceso al sistema." });
    } else {
      toast({ variant: "destructive", title: "Error al aprobar", description: result.message });
    }
  };

  const handleUsersChange = async (updatedUsers: any) => {
    await setUsers(updatedUsers);
    await fetchAllUsers(); // Refetch to ensure consistency
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Crear, editar y gestionar los accesos de los usuarios al sistema.</p>
      </div>
      <UsersTable 
        initialUsers={users} 
        onUsersChange={handleUsersChange} 
        onApproveUser={handleApproveUser}
        allCompanies={companies}
        onUpdate={fetchAllUsers}
      />
    </div>
  );
}
