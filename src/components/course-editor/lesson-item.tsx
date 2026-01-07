// src/components/course-editor/lesson-item.tsx
'use client';

import { useState } from 'react';
import { FileText, Video, HelpCircle, File, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Lesson, LessonType } from '@/types';
import { motion } from 'framer-motion';

interface LessonItemProps {
    lesson: Lesson;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<Lesson>) => void;
    onDelete: () => void;
}

const lessonTypeIcons: Record<LessonType, typeof FileText> = {
    TEXT: FileText,
    VIDEO: Video,
    QUIZ: HelpCircle,
    FILE: File,
};

const lessonTypeColors: Record<LessonType, string> = {
    TEXT: 'text-blue-500',
    VIDEO: 'text-purple-500',
    QUIZ: 'text-green-500',
    FILE: 'text-orange-500',
};

export function LessonItem({
    lesson,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
}: LessonItemProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const Icon = lessonTypeIcons[lesson.contentBlocks[0]?.type || 'TEXT'];
    const iconColor = lessonTypeColors[lesson.contentBlocks[0]?.type || 'TEXT'];

    const isComplete = lesson.contentBlocks.length > 0 && lesson.contentBlocks.every(b => b.content);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={cn(
                'flex items-center gap-2 p-2 rounded-md border transition-all cursor-pointer group',
                isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:border-border hover:bg-muted/50'
            )}
            onClick={onSelect}
        >
            {/* Lesson Type Icon */}
            <div className={cn('flex-shrink-0', iconColor)}>
                <Icon className="h-4 w-4" />
            </div>

            {/* Lesson Title */}
            {isEditingTitle ? (
                <Input
                    value={lesson.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingTitle(false);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-xs flex-1"
                    autoFocus
                />
            ) : (
                <div
                    className="flex-1 text-xs truncate"
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        setIsEditingTitle(true);
                    }}
                >
                    {lesson.title || 'Sin título'}
                </div>
            )}

            {/* Completion Status */}
            {isComplete ? (
                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
            ) : (
                <Circle className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
            )}

            {/* Delete Button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
                <Trash2 className="h-3 w-3" />
            </Button>
        </motion.div>
    );
}
