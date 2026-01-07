// src/components/quizz-it/editor/adaptive-canvas.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Question } from '@/types';
import type { ViewportMode } from '@/hooks/use-quiz-editor-state';
import { getViewportWidth } from '@/lib/editor-utils';
import { QuestionPreview } from './question-preview';

interface AdaptiveCanvasProps {
    question: Question | null;
    viewportMode: ViewportMode;
    onUpdateQuestion: (updates: Partial<Question>) => void;
}

export function AdaptiveCanvas({
    question,
    viewportMode,
    onUpdateQuestion,
}: AdaptiveCanvasProps) {
    const viewportWidth = getViewportWidth(viewportMode);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Canvas Container with Grid Pattern */}
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
                <div className="min-h-full flex items-center justify-center p-8">
                    <motion.div
                        layout
                        className={cn(
                            'bg-background border-2 rounded-2xl shadow-2xl overflow-hidden',
                            'transition-all duration-300 ease-out'
                        )}
                        style={{
                            width: viewportWidth,
                            maxWidth: '100%',
                        }}
                        initial={false}
                        animate={{
                            width: viewportWidth,
                        }}
                        transition={{
                            duration: 0.3,
                            ease: [0.4, 0, 0.2, 1],
                        }}
                    >
                        {question ? (
                            <QuestionPreview
                                question={question}
                                onUpdateQuestion={onUpdateQuestion}
                                viewportMode={viewportMode}
                            />
                        ) : (
                            <EmptyState />
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex items-center justify-center min-h-[500px] p-12 text-center">
            <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-muted-foreground/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-1">Sin pregunta seleccionada</h3>
                    <p className="text-sm text-muted-foreground">
                        Selecciona una pregunta del explorador o crea una nueva
                    </p>
                </div>
            </div>
        </div>
    );
}
