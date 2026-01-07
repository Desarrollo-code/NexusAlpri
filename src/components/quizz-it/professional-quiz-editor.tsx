// src/components/quizz-it/professional-quiz-editor.tsx
'use client';

import { Save, Undo2, Redo2, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuizEditorState } from '@/hooks/use-quiz-editor-state';
import { ViewportSelector } from './editor/viewport-selector';
import { QuestionExplorer } from './editor/question-explorer';
import { AdaptiveCanvas } from './editor/adaptive-canvas';
import { PropertiesPanel } from './editor/properties-panel';
import { generateUniqueId } from '@/lib/editor-utils';
import type { Quiz, Question } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProfessionalQuizEditorProps {
    quiz?: Quiz | null;
    onSave?: (quiz: Quiz) => void;
    onClose?: () => void;
    onPreview?: (quiz: Quiz) => void;
}

export function ProfessionalQuizEditor({
    quiz: initialQuiz,
    onSave,
    onClose,
    onPreview,
}: ProfessionalQuizEditorProps) {
    const {
        quiz,
        selectedQuestion,
        selectedQuestionId,
        viewportMode,
        isDirty,
        canUndo,
        canRedo,
        selectQuestion,
        setViewportMode,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        reorderQuestions,
        undo,
        redo,
        markClean,
    } = useQuizEditorState(initialQuiz);

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: generateUniqueId('question'),
            text: '',
            type: 'MULTIPLE_CHOICE',
            order: quiz?.questions.length || 0,
            options: [
                {
                    id: generateUniqueId('option'),
                    text: '',
                    isCorrect: false,
                    points: 10,
                },
                {
                    id: generateUniqueId('option'),
                    text: '',
                    isCorrect: false,
                    points: 10,
                },
            ],
        };
        addQuestion(newQuestion);
    };

    const handleUpdateQuestion = (updates: Partial<Question>) => {
        if (selectedQuestionId) {
            updateQuestion(selectedQuestionId, updates);
        }
    };

    const handleSave = () => {
        if (quiz && onSave) {
            onSave(quiz);
            markClean();
        }
    };

    const handlePreview = () => {
        if (quiz && onPreview) {
            onPreview(quiz);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Top Toolbar */}
            <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    <h1 className="font-semibold text-sm">
                        {quiz?.title || 'Editor de Quiz'}
                    </h1>
                    {isDirty && (
                        <span className="text-xs text-muted-foreground">
                            • Sin guardar
                        </span>
                    )}
                </div>

                {/* Center Section - Viewport Selector */}
                <div className="flex-1 flex justify-center">
                    <ViewportSelector mode={viewportMode} onChange={setViewportMode} />
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Undo/Redo */}
                    <div className="flex items-center gap-1 mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={undo}
                            disabled={!canUndo}
                            className="h-8 w-8 p-0"
                        >
                            <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={redo}
                            disabled={!canRedo}
                            className="h-8 w-8 p-0"
                        >
                            <Redo2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Preview */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        className="gap-2"
                    >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Vista Previa</span>
                    </Button>

                    {/* Save */}
                    <Button
                        onClick={handleSave}
                        size="sm"
                        disabled={!isDirty}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">Guardar</span>
                    </Button>

                    {/* Close */}
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Editor Grid */}
            <div className="flex-1 grid grid-cols-[280px_1fr_320px] overflow-hidden">
                {/* Left Column - Question Explorer */}
                <QuestionExplorer
                    questions={quiz?.questions || []}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={selectQuestion}
                    onAddQuestion={handleAddQuestion}
                    onReorder={reorderQuestions}
                />

                {/* Center Column - Adaptive Canvas */}
                <AdaptiveCanvas
                    question={selectedQuestion}
                    viewportMode={viewportMode}
                    onUpdateQuestion={handleUpdateQuestion}
                />

                {/* Right Column - Properties Panel */}
                <PropertiesPanel
                    question={selectedQuestion}
                    onUpdateQuestion={handleUpdateQuestion}
                />
            </div>
        </div>
    );
}
