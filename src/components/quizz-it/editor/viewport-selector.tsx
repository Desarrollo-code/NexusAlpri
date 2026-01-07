// src/components/quizz-it/editor/viewport-selector.tsx
'use client';

import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ViewportMode } from '@/hooks/use-quiz-editor-state';

interface ViewportSelectorProps {
    mode: ViewportMode;
    onChange: (mode: ViewportMode) => void;
}

const viewports: { mode: ViewportMode; icon: typeof Smartphone; label: string; width: string }[] = [
    { mode: 'mobile', icon: Smartphone, label: 'Móvil', width: '375px' },
    { mode: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
    { mode: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
];

export function ViewportSelector({ mode, onChange }: ViewportSelectorProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border">
            {viewports.map(({ mode: viewportMode, icon: Icon, label, width }) => (
                <Button
                    key={viewportMode}
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(viewportMode)}
                    className={cn(
                        'gap-2 transition-all duration-200',
                        mode === viewportMode
                            ? 'bg-background shadow-sm'
                            : 'hover:bg-background/50'
                    )}
                >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">{label}</span>
                    <span className="hidden md:inline text-[10px] text-muted-foreground">
                        {width}
                    </span>
                </Button>
            ))}
        </div>
    );
}
