// src/components/course-editor/module-explorer.tsx
'use client';

import { Plus, Search, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import type { Module, Lesson } from '@/types';
import { ModuleCard } from './module-card';
import { LessonItem } from './lesson-item';
import { cn } from '@/lib/utils';

interface ModuleExplorerProps {
    modules: Module[];
    selectedModuleId: string | null;
    selectedLessonId: string | null;
    onSelectModule: (moduleId: string) => void;
    onSelectLesson: (moduleId: string, lessonId: string) => void;
    onAddModule: () => void;
    onUpdateModule: (moduleId: string, updates: Partial<Module>) => void;
    onDeleteModule: (moduleId: string) => void;
    onAddLesson: (moduleId: string) => void;
    onUpdateLesson: (moduleId: string, lessonId: string, updates: Partial<Lesson>) => void;
    onDeleteLesson: (moduleId: string, lessonId: string) => void;
    className?: string;
}

export function ModuleExplorer({
    modules,
    selectedModuleId,
    selectedLessonId,
    onSelectModule,
    onSelectLesson,
    onAddModule,
    onUpdateModule,
    onDeleteModule,
    onAddLesson,
    onUpdateLesson,
    onDeleteLesson,
    className,
}: ModuleExplorerProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredModules = modules.filter(module =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.lessons.some(lesson =>
            lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className={cn('flex flex-col h-full bg-muted/30 border-r', className)}>
            {/* Header */}
            <div className="p-4 border-b bg-background/50 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Estructura del Curso</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {modules.length} módulos
                    </span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar módulos o lecciones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 text-sm"
                    />
                </div>

                {/* Add Module Button */}
                <Button
                    onClick={onAddModule}
                    size="sm"
                    className="w-full gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Módulo
                </Button>
            </div>

            {/* Modules List */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {filteredModules.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <Layers className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? 'No se encontraron resultados' : 'No hay módulos aún'}
                            </p>
                            {!searchQuery && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Haz clic en "Nuevo Módulo"
                                </p>
                            )}
                        </div>
                    ) : (
                        filteredModules.map((module, index) => (
                            <ModuleCard
                                key={module.id}
                                module={module}
                                index={index}
                                isSelected={module.id === selectedModuleId}
                                onSelect={() => onSelectModule(module.id)}
                                onUpdate={(updates) => onUpdateModule(module.id, updates)}
                                onDelete={() => onDeleteModule(module.id)}
                                onAddLesson={() => onAddLesson(module.id)}
                            >
                                {module.lessons.map((lesson) => (
                                    <LessonItem
                                        key={lesson.id}
                                        lesson={lesson}
                                        isSelected={lesson.id === selectedLessonId}
                                        onSelect={() => onSelectLesson(module.id, lesson.id)}
                                        onUpdate={(updates) => onUpdateLesson(module.id, lesson.id, updates)}
                                        onDelete={() => onDeleteLesson(module.id, lesson.id)}
                                    />
                                ))}
                            </ModuleCard>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
