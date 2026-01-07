// src/components/course-editor/module-card.tsx
'use client';

import { useState } from 'react';
import { GripVertical, ChevronDown, ChevronRight, Trash2, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Module } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleCardProps {
    module: Module;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<Module>) => void;
    onDelete: () => void;
    onAddLesson: () => void;
    children?: React.ReactNode;
}

export function ModuleCard({
    module,
    index,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onAddLesson,
    children,
}: ModuleCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="group"
        >
            {/* Module Header */}
            <div
                className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer',
                    isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
                onClick={onSelect}
            >
                {/* Drag Handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Expand/Collapse */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="h-6 w-6 p-0"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </Button>

                {/* Module Number */}
                <Badge
                    variant="secondary"
                    className="h-6 w-6 rounded-full flex items-center justify-center p-0 font-bold text-xs"
                >
                    {index + 1}
                </Badge>

                {/* Module Title */}
                {isEditingTitle ? (
                    <Input
                        value={module.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingTitle(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-sm flex-1"
                        autoFocus
                    />
                ) : (
                    <div
                        className="flex-1 font-medium text-sm truncate"
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            setIsEditingTitle(true);
                        }}
                    >
                        {module.title || 'Sin título'}
                    </div>
                )}

                {/* Lesson Count */}
                <Badge variant="outline" className="text-xs gap-1">
                    <BookOpen className="h-3 w-3" />
                    {module.lessons.length}
                </Badge>

                {/* Delete Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            {/* Lessons List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-8 mt-2 space-y-1">
                            {children}

                            {/* Add Lesson Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddLesson();
                                }}
                                className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <Plus className="h-3 w-3" />
                                Agregar Lección
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
