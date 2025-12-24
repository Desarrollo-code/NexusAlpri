'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlus, UploadCloud, Star, Clock, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceEmptyStateProps {
    view: 'all' | 'favorites' | 'recent';
    canManage: boolean;
    onCreateFolder?: () => void;
    onUploadFile?: () => void;
    className?: string;
}

export function ResourceEmptyState({
    view,
    canManage,
    onCreateFolder,
    onUploadFile,
    className
}: ResourceEmptyStateProps) {

    const getEmptyStateContent = () => {
        switch (view) {
            case 'favorites':
                return {
                    icon: Star,
                    iconColor: 'text-yellow-500',
                    title: 'Aún no tienes favoritos',
                    description: 'Marca recursos como favoritos para acceder rápidamente a ellos',
                    tip: '💡 Haz clic derecho en cualquier recurso y selecciona "Fijar"',
                    showActions: false
                };
            case 'recent':
                return {
                    icon: Clock,
                    iconColor: 'text-blue-500',
                    title: 'No hay recursos recientes',
                    description: 'Los recursos que visualices aparecerán aquí',
                    tip: '📌 Abre cualquier archivo para comenzar tu historial',
                    showActions: false
                };
            default: // 'all'
                return {
                    icon: Inbox,
                    iconColor: 'text-muted-foreground',
                    title: 'Tu biblioteca está vacía',
                    description: 'Comienza organizando tus recursos en carpetas o sube tu primer archivo',
                    tip: null,
                    showActions: canManage
                };
        }
    };

    const content = getEmptyStateContent();
    const Icon = content.icon;

    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-16 px-4 text-center",
            "animate-in fade-in duration-500",
            className
        )}>
            {/* Icon with gentle animation */}
            <div className="mb-6 relative">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-muted/50 rounded-full p-8">
                    <Icon className={cn("h-16 w-16", content.iconColor)} strokeWidth={1.5} />
                </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-semibold mb-2 text-foreground">
                {content.title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground max-w-md mb-6">
                {content.description}
            </p>

            {/* Tip */}
            {content.tip && (
                <div className="bg-muted/30 border border-border/50 rounded-lg px-4 py-3 mb-6 max-w-md">
                    <p className="text-sm text-muted-foreground">
                        {content.tip}
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            {content.showActions && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={onCreateFolder}
                        size="lg"
                        className="gap-2"
                    >
                        <FolderPlus className="h-5 w-5" />
                        Crear Carpeta
                    </Button>
                    <Button
                        onClick={onUploadFile}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                    >
                        <UploadCloud className="h-5 w-5" />
                        Subir Archivo
                    </Button>
                </div>
            )}
        </div>
    );
}
