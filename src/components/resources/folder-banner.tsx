import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Folder, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppResourceType } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FolderBannerProps {
    folder: AppResourceType;
    onEdit: () => void;
    canManage: boolean;
}

export function FolderBanner({ folder, onEdit, canManage }: FolderBannerProps) {
    // Generate a deterministic gradient/pattern based on folder ID
    const bannerStyle = useMemo(() => {
        if (!folder?.id) return { className: 'from-primary/5 to-primary/10' };

        const colors = [
            'from-blue-500/10 via-indigo-500/5 to-background',
            'from-emerald-500/10 via-teal-500/5 to-background',
            'from-amber-500/10 via-orange-500/5 to-background',
            'from-rose-500/10 via-pink-500/5 to-background',
            'from-violet-500/10 via-fuchsia-500/5 to-background',
        ];

        // Simple hash function
        const hash = folder.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colorClass = colors[hash % colors.length];

        return { className: colorClass };
    }, [folder?.id]);

    if (!folder) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
                "relative w-full rounded-2xl overflow-hidden border border-border/40 mb-8 shadow-sm",
                "bg-gradient-to-br p-6 md:p-8",
                bannerStyle.className
            )}
        >
            {/* Abstract Background Decoration */}
            <div className="absolute top-0 right-0 p-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <Folder className="w-64 h-64 text-foreground" strokeWidth={0.5} />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3 max-w-3xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background/40 backdrop-blur-md border border-white/10 shadow-sm">
                            <Folder className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="bg-background/40 backdrop-blur-md border-white/10">
                            Carpeta
                        </Badge>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground bg-clip-text">
                        {folder.title}
                    </h1>

                    {folder.description && (
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                            {folder.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
                        {folder.uploaderName && (
                            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1 rounded-full border border-white/5">
                                <User className="h-3.5 w-3.5" />
                                <span className="font-medium">{folder.uploaderName}</span>
                            </div>
                        )}
                        {folder.uploadDate && (
                            <div className="flex items-center gap-1.5 bg-background/30 px-3 py-1 rounded-full border border-white/5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Creado el {new Date(folder.uploadDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {canManage && (
                    <Button
                        onClick={onEdit}
                        variant="secondary"
                        className="shrink-0 flex items-center gap-2 shadow-sm hover:shadow-md transition-all bg-background/60 hover:bg-background/80 backdrop-blur-sm border border-white/10"
                    >
                        <Settings2 className="h-4 w-4" />
                        <span>Editar Carpeta</span>
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
