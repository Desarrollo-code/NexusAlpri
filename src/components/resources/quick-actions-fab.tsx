'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlus, UploadCloud, ListVideo, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickActionsFABProps {
    onCreateFolder: () => void;
    onUploadFile: () => void;
    onCreatePlaylist: () => void;
    canManage: boolean;
}

export function QuickActionsFAB({
    onCreateFolder,
    onUploadFile,
    onCreatePlaylist,
    canManage
}: QuickActionsFABProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!canManage) return null;

    const actions = [
        { icon: FolderPlus, label: 'Nueva Carpeta', onClick: onCreateFolder, color: 'bg-blue-500 hover:bg-blue-600' },
        { icon: UploadCloud, label: 'Subir Archivo', onClick: onUploadFile, color: 'bg-green-500 hover:bg-green-600' },
        { icon: ListVideo, label: 'Crear Playlist', onClick: onCreatePlaylist, color: 'bg-purple-500 hover:bg-purple-600' },
    ];

    const handleActionClick = (action: typeof actions[0]) => {
        action.onClick();
        setIsOpen(false);
    };

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* FAB Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
                {/* Action Buttons */}
                <AnimatePresence>
                    {isOpen && actions.map((action, index) => (
                        <motion.div
                            key={action.label}
                            initial={{ scale: 0, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, y: 20 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                                delay: index * 0.05
                            }}
                            className="flex items-center gap-3"
                        >
                            {/* Label */}
                            <span className="bg-card border shadow-lg rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap">
                                {action.label}
                            </span>

                            {/* Action Button */}
                            <Button
                                size="icon"
                                className={cn(
                                    "h-12 w-12 rounded-full shadow-lg transition-all",
                                    action.color
                                )}
                                onClick={() => handleActionClick(action)}
                            >
                                <action.icon className="h-5 w-5 text-white" />
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Main FAB */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-2xl transition-all",
                            "bg-primary hover:bg-primary/90",
                            isOpen && "rotate-45"
                        )}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </div>
        </>
    );
}
