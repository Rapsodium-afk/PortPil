'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { readData, writeData } from '@/lib/actions';
import { RoleDefinition, UserRole, RoleType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    const data = await readData<RoleDefinition[]>('roles.json');
    setRoles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSave = async () => {
    try {
      await writeData('roles.json', roles);
      toast({
        title: "Roles guardados",
        description: "La configuración de roles se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de roles.",
        variant: "destructive",
      });
    }
  };

  const updateRoleField = (id: UserRole, field: keyof RoleDefinition, value: any) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const toggleZone = (id: UserRole, zone: string) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== id) return r;
      const zones = r.visibleZones.includes(zone)
        ? r.visibleZones.filter(z => z !== zone)
        : [...r.visibleZones, zone];
      return { ...r, visibleZones: zones };
    }));
  };

  if (loading) return <div className="p-8">Cargando gestión de roles...</div>;

  const zones = ["TTP1", "TTP2", "TTIA", "CANTIL", "TECO"];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
          <p className="text-muted-foreground">Configura los permisos y comportamientos de cada perfil de usuario.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRoles}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refrescar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {role.id}
                </CardTitle>
                <Badge variant={role.type === 'Staff' ? 'default' : 'secondary'}>
                  {role.type}
                </Badge>
              </div>
              <CardDescription>{role.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Comportamiento</Label>
                <Select 
                  value={role.type} 
                  onValueChange={(val: RoleType) => updateRoleField(role.id, 'type', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staff">Staff (Gestor CAU)</SelectItem>
                    <SelectItem value="Client">Cliente (Usuario CAU)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Zonas Visibles (Plazas)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {zones.map(zone => (
                    <div key={zone} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`zone-${role.id}-${zone}`} 
                        checked={role.visibleZones.includes(zone)}
                        onCheckedChange={() => toggleZone(role.id, zone)}
                      />
                      <label 
                        htmlFor={`zone-${role.id}-${zone}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {zone}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
