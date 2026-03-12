'use client';

import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { CauCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { writeData } from '@/lib/actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CategoriesEditorProps {
  initialCategories: CauCategory[];
}

export default function CategoriesEditor({ initialCategories }: CategoriesEditorProps) {
  const [categories, setCategories] = useState<CauCategory[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CauCategory | null>(null);
  const { toast } = useToast();

  const handleAddCategory = async () => {
    if (newCategoryName.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El nombre de la categoría debe tener al menos 3 caracteres.',
      });
      return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'La categoría ya existe.',
        });
        return;
    }

    const newCategory: CauCategory = {
      id: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newCategoryName.trim(),
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await writeData('cau-request-categories.json', updatedCategories);
    toast({
      title: 'Categoría añadida',
      description: `La categoría "${newCategory.name}" ha sido creada.`,
    });
    setNewCategoryName('');
  };

  const openDeleteDialog = (category: CauCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (categoryToDelete) {
      const updatedCategories = categories.filter(c => c.id !== categoryToDelete.id);
      setCategories(updatedCategories);
      await writeData('cau-request-categories.json', updatedCategories);
      toast({
        title: 'Categoría eliminada',
        description: `La categoría "${categoryToDelete.name}" ha sido eliminada.`,
      });
      setCategoryToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Editor de Categorías</CardTitle>
          <CardDescription>
            Gestiona las categorías principales para las solicitudes del CAU.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
                <h4 className="font-medium">Categorías existentes</h4>
                <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 rounded-md border bg-secondary px-3 py-1">
                        <span className="text-sm font-medium text-secondary-foreground">{cat.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openDeleteDialog(cat)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                </div>
                 {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay categorías definidas.</p>
                )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la nueva categoría"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los tipos de solicitud que usen la categoría
              <span className="font-semibold"> "{categoryToDelete?.name}"</span> no se eliminarán, pero deberías reasignarlos a una nueva categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
