// src/components/quizz-it/editor/question-preview.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Question, AnswerOption } from '@/types';
import type { ViewportMode } from '@/hooks/use-quiz-editor-state';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionPreviewProps {
    question: Question;
    onUpdateQuestion: (updates: Partial<Question>) => void;
    viewportMode: ViewportMode;
}

export function QuestionPreview({
    question,
    onUpdateQuestion,
    viewportMode,
}: QuestionPreviewProps) {
    const [editingText, setEditingText] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isMobile = viewportMode === 'mobile';
    const isTablet = viewportMode === 'tablet';

    useEffect(() => {
        if (editingText && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [editingText]);

    const handleTextChange = (text: string) => {
        onUpdateQuestion({ text });
    };

    const handleOptionChange = (optionId: string, text: string) => {
        onUpdateQuestion({
            options: question.options.map(opt =>
                opt.id === optionId ? { ...opt, text } : opt
            ),
        });
    };

    const handleToggleCorrect = (optionId: string) => {
        onUpdateQuestion({
            options: question.options.map(opt =>
                opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
            ),
        });
    };

    return (
        <div className={cn(
            'p-8 space-y-6',
            isMobile && 'p-4 space-y-4',
            isTablet && 'p-6 space-y-5'
        )}>
            {/* Question Text */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Pregunta
                    </span>
                    {question.imageUrl && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => onUpdateQuestion({ imageUrl: null })}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Quitar imagen
                        </Button>
                    )}
                </div>

                {editingText ? (
                    <textarea
                        ref={textareaRef}
                        value={question.text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onBlur={() => setEditingText(false)}
                        className={cn(
                            'w-full p-4 rounded-lg border-2 border-primary bg-background',
                            'focus:outline-none resize-none',
                            isMobile ? 'text-base min-h-[80px]' : 'text-lg min-h-[100px]'
                        )}
                        placeholder="Escribe tu pregunta aquí..."
                    />
                ) : (
                    <div
                        onClick={() => setEditingText(true)}
                        className={cn(
                            'w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/30',
                            'hover:border-primary hover:bg-muted/50 cursor-text transition-all',
                            'min-h-[100px] flex items-center',
                            isMobile && 'min-h-[80px] text-base',
                            !question.text && 'text-muted-foreground'
                        )}
                    >
                        {question.text || 'Haz clic para editar la pregunta...'}
                    </div>
                )}

                {/* Question Image */}
                {question.imageUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-lg overflow-hidden border"
                    >
                        <img
                            src={question.imageUrl}
                            alt="Question"
                            className="w-full h-auto max-h-64 object-cover"
                        />
                    </motion.div>
                )}
            </div>

            {/* Options */}
            <div className="space-y-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Opciones de Respuesta
                </span>

                <AnimatePresence mode="popLayout">
                    {question.options.map((option, index) => (
                        <OptionPreview
                            key={option.id}
                            option={option}
                            index={index}
                            isMobile={isMobile}
                            onChange={(text) => handleOptionChange(option.id, text)}
                            onToggleCorrect={() => handleToggleCorrect(option.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

interface OptionPreviewProps {
    option: AnswerOption;
    index: number;
    isMobile: boolean;
    onChange: (text: string) => void;
    onToggleCorrect: () => void;
}

function OptionPreview({
    option,
    index,
    isMobile,
    onChange,
    onToggleCorrect,
}: OptionPreviewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                'flex items-center gap-3 p-3 rounded-lg border-2 transition-all group',
                option.isCorrect
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50',
                isMobile && 'p-2 gap-2'
            )}
        >
            {/* Letter Badge */}
            <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                option.isCorrect
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
            )}>
                {letters[index]}
            </div>

            {/* Option Text */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={option.text}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditing(false);
                    }}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    placeholder="Texto de la opción..."
                />
            ) : (
                <div
                    onClick={() => setIsEditing(true)}
                    className={cn(
                        'flex-1 cursor-text text-sm',
                        !option.text && 'text-muted-foreground'
                    )}
                >
                    {option.text || 'Haz clic para editar...'}
                </div>
            )}

            {/* Correct Toggle */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCorrect}
                className={cn(
                    'flex-shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                    option.isCorrect && 'opacity-100'
                )}
            >
                {option.isCorrect ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                )}
            </Button>
        </motion.div>
    );
}
