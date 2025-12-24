'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, FolderInput } from 'lucide-react';
import { FolderTree } from './folder-tree';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface MoveResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceIds: string[];
    onMoveSuccess: () => void;
}

export function MoveResourceModal({ isOpen, onClose, resourceIds, onMoveSuccess }: MoveResourceModalProps) {
    const { toast } = useToast();
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    const handleMove = async () => {
        setIsMoving(true);
        try {
            const res = await fetch('/api/resources/bulk-move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: resourceIds, targetFolderId: selectedFolderId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al mover los recursos.');
            }

            toast({ title: 'Éxito', description: 'Recursos movidos correctamente.' });
            onMoveSuccess();
            onClose();
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mover {resourceIds.length} elemento(s)</DialogTitle>
                    <DialogDescription>
                        Selecciona la carpeta de destino.
                    </DialogDescription>
                </DialogHeader>

                <div className="border rounded-md p-2 h-[300px]">
                    <ScrollArea className="h-full">
                        <FolderTree
                            currentFolderId={selectedFolderId}
                            onNavigate={(folder) => setSelectedFolderId(folder.id || null)}
                            className="w-full"
                        />
                    </ScrollArea>
                </div>

                <div className="text-sm text-muted-foreground mt-2">
                    Destino: {selectedFolderId ? 'Carpeta seleccionada' : 'Raíz (Nivel principal)'}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isMoving}>Cancelar</Button>
                    <Button onClick={handleMove} disabled={isMoving}>
                        {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <FolderInput className="mr-2 h-4 w-4" />
                        Mover aquí
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
