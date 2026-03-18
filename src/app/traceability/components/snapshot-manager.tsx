'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Save, Edit3, History, 
  CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { createManualSnapshotAction, updateSnapshotAction } from '@/lib/traceability';
import { useToast } from "@/hooks/use-toast";

export function SnapshotManager({ snapshots = [] }: { snapshots?: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    terminal_id: 'TTP1',
    ocupacion: 0,
    notas: ''
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createManualSnapshotAction(formData.terminal_id, formData.ocupacion, formData.notas);
      toast({
        title: "Snapshot creado",
        description: "El registro histórico se ha guardado correctamente.",
      });
      setIsAdding(false);
      // In a real app, we'd trigger a router.refresh() or parent data re-fetch
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el snapshot.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    setLoading(true);
    try {
      await updateSnapshotAction(id, { 
        ocupacion: formData.ocupacion, 
        notas: formData.notas 
      });
      toast({
        title: "Snapshot actualizado",
        description: "Los cambios se han guardado.",
      });
      setEditingId(null);
    } catch (error) {
      toast({
          title: "Error",
          description: "No se pudo actualizar el snapshot.",
          variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white/40 backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Gestión de Snapshots Históricos
          </CardTitle>
          <CardDescription>Edita ocupación histórica o añade registros manuales</CardDescription>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-1" /> Nuevo Snapshot
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {isAdding && (
          <div className="mb-8 p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Terminal / Zona</Label>
                <Input 
                  value={formData.terminal_id} 
                  onChange={(e) => setFormData({...formData, terminal_id: e.target.value})}
                  className="bg-white border-indigo-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Ocupación (Vehículos)</Label>
                <Input 
                  type="number"
                  value={formData.ocupacion} 
                  onChange={(e) => setFormData({...formData, ocupacion: parseInt(e.target.value)})}
                  className="bg-white border-indigo-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Notas de Auditoría</Label>
              <Textarea 
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Motivo de la creación manual..."
                className="bg-white border-indigo-100 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCreate} disabled={loading} className="bg-indigo-600">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar Registro
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm italic">No hay registros para mostrar</p>
            </div>
          ) : (
            snapshots.map((s) => (
              <div key={s.id} className="group flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-md">
                <div className="flex gap-4 items-center">
                  <div className={`p-2 rounded-lg ${s.manual ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                    {s.manual ? <Edit3 className="h-4 w-4" /> : <History className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{s.terminal_id} — {s.ocupacion} veh.</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(s.fecha_hora).toLocaleString()} 
                      {s.manual && <span className="ml-2 text-amber-500 font-bold uppercase tracking-tighter">● MANUAL</span>}
                    </p>
                    {s.notas && <p className="text-[10px] text-slate-500 mt-1 italic">"{s.notas}"</p>}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600"
                  onClick={() => {
                    setEditingId(s.id);
                    setFormData({ terminal_id: s.terminal_id, ocupacion: s.ocupacion, notas: s.notas || '' });
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
