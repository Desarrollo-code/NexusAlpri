// src/components/quizz-it/editor/question-explorer.tsx
'use client';

import { Plus, GripVertical, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, Reorder } from 'framer-motion';
import type { Question } from '@/types';
import { calculateQuestionCompleteness, getQuestionTypeLabel, getQuestionTypeColor } from '@/lib/editor-utils';

interface QuestionExplorerProps {
    questions: Question[];
    selectedQuestionId: string | null;
    onSelectQuestion: (questionId: string) => void;
    onAddQuestion: () => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

export function QuestionExplorer({
    questions,
    selectedQuestionId,
    onSelectQuestion,
    onAddQuestion,
    onReorder,
}: QuestionExplorerProps) {
    return (
        <div className="flex flex-col h-full bg-muted/30 border-r">
            {/* Header */}
            <div className="p-4 border-b bg-background/50">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Preguntas</h3>
                    <span className="text-xs text-muted-foreground">{questions.length}</span>
                </div>
                <Button
                    onClick={onAddQuestion}
                    size="sm"
                    className="w-full gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Pregunta
                </Button>
            </div>

            {/* Questions List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                    {questions.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <Circle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                No hay preguntas aún
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Haz clic en "Nueva Pregunta"
                            </p>
                        </div>
                    ) : (
                        questions.map((question, index) => (
                            <QuestionThumbnail
                                key={question.id}
                                question={question}
                                index={index}
                                isSelected={question.id === selectedQuestionId}
                                onClick={() => onSelectQuestion(question.id)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

interface QuestionThumbnailProps {
    question: Question;
    index: number;
    isSelected: boolean;
    onClick: () => void;
}

function QuestionThumbnail({ question, index, isSelected, onClick }: QuestionThumbnailProps) {
    const completeness = calculateQuestionCompleteness(question);
    const isComplete = completeness === 100;
    const hasIssues = completeness < 50;

    return (
        <motion.button
            layout
            onClick={onClick}
            className={cn(
                'w-full p-3 rounded-lg border-2 transition-all duration-200 text-left group',
                'hover:scale-[1.02] hover:shadow-md',
                isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-background hover:border-primary/50'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                        {index + 1}
                    </div>
                    <span className="text-xs font-medium line-clamp-1">
                        {getQuestionTypeLabel(question.type)}
                    </span>
                </div>

                {/* Status Icon */}
                {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : hasIssues ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                )}
            </div>

            {/* Question Preview */}
            <div className="space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                    {question.text || 'Sin texto...'}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className={cn(
                            'h-full transition-all duration-300',
                            isComplete ? 'bg-green-500' : hasIssues ? 'bg-yellow-500' : 'bg-primary'
                        )}
                        style={{ width: `${completeness}%` }}
                    />
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{question.options.length} opciones</span>
                    <span>{Math.round(completeness)}%</span>
                </div>
            </div>

            {/* Drag Handle (visible on hover) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
        </motion.button>
    );
}
