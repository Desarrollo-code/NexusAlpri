// src/components/course-editor/adaptive-canvas.tsx
'use client';

import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ViewportMode } from '@/hooks/use-course-editor-state';
import type { Lesson } from '@/types';

interface AdaptiveCanvasProps {
    lesson: Lesson | null;
    viewportMode: ViewportMode;
    onViewportChange: (mode: ViewportMode) => void;
    children?: React.ReactNode;
}

const viewports: { mode: ViewportMode; icon: typeof Smartphone; label: string; width: string }[] = [
    { mode: 'mobile', icon: Smartphone, label: 'Móvil', width: '375px' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
    { mode: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
];

function getViewportWidth(mode: ViewportMode): string {
    const viewport = viewports.find(v => v.mode === mode);
    return viewport?.width || '100%';
}

export function AdaptiveCanvas({
    lesson,
    viewportMode,
    onViewportChange,
    children,
}: AdaptiveCanvasProps) {
    const viewportWidth = getViewportWidth(viewportMode);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Toolbar */}
            <div className="h-14 border-b flex items-center justify-between px-4 gap-4 bg-background/95 backdrop-blur">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm truncate" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                        {lesson?.title || 'Selecciona una lección'}
                    </h2>
                </div>

                {/* Viewport Selector */}
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
                    {viewports.map(({ mode, icon: Icon, label }) => (
                        <Button
                            key={mode}
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewportChange(mode)}
                            className={cn(
                                'gap-2 transition-all duration-200 h-8',
                                viewportMode === mode
                                    ? 'bg-background shadow-sm'
                                    : 'hover:bg-background/50'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline text-xs">{label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-auto relative">
                {/* Grid Pattern Background */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
                        backgroundSize: '20px 20px',
                    }}
                />

                {/* Centered Viewport */}
                <div className="min-h-full flex items-start justify-center p-4 md:p-8">
                    <motion.div
                        layout
                        className={cn(
                            'bg-background border-2 rounded-xl shadow-2xl overflow-hidden w-full',
                            viewportMode === 'mobile' && 'max-w-[375px]',
                            viewportMode === 'tablet' && 'max-w-[768px]'
                        )}
                        style={{
                            width: viewportMode === 'desktop' ? '100%' : viewportWidth,
                        }}
                        initial={false}
                        animate={{
                            width: viewportMode === 'desktop' ? '100%' : viewportWidth,
                        }}
                        transition={{
                            duration: 0.4,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                    >
                        {lesson ? (
                            <div className={cn(
                                'p-6',
                                viewportMode === 'mobile' && 'p-4'
                            )}>
                                {children || <LessonPreview lesson={lesson} viewportMode={viewportMode} />}
                            </div>
                        ) : (
                            <EmptyState />
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function LessonPreview({ lesson, viewportMode }: { lesson: Lesson; viewportMode: ViewportMode }) {
    return (
        <div className="space-y-4">
            <h1
                className="font-bold"
                style={{ fontSize: viewportMode === 'mobile' ? 'clamp(1.25rem, 4vw, 1.5rem)' : 'clamp(1.5rem, 4vw, 2rem)' }}
            >
                {lesson.title}
            </h1>

            <div className="space-y-3">
                {lesson.contentBlocks.map((block, index) => (
                    <div key={block.id} className="p-4 rounded-lg border bg-muted/30">
                        <p className="text-sm text-muted-foreground mb-2">
                            Bloque {index + 1} - {block.type}
                        </p>
                        {block.content && (
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: block.content }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-12 text-center">
            <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                    <Monitor className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-1" style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}>
                        Sin lección seleccionada
                    </h3>
                    <p className="text-sm text-muted-foreground" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                        Selecciona una lección del explorador para comenzar a editar
                    </p>
                </div>
            </div>
        </div>
    );
}
