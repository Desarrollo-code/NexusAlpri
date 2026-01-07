// src/hooks/use-quiz-editor-state.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Quiz, Question, AnswerOption } from '@/types';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

interface QuizEditorState {
    quiz: Quiz | null;
    selectedQuestionId: string | null;
    viewportMode: ViewportMode;
    isDirty: boolean;
    history: Quiz[];
    historyIndex: number;
}

export function useQuizEditorState(initialQuiz?: Quiz | null) {
    const [state, setState] = useState<QuizEditorState>({
        quiz: initialQuiz || null,
        selectedQuestionId: null,
        viewportMode: 'desktop',
        isDirty: false,
        history: initialQuiz ? [initialQuiz] : [],
        historyIndex: 0,
    });

    const updateQuiz = useCallback((updater: (quiz: Quiz) => Quiz) => {
        setState(prev => {
            if (!prev.quiz) return prev;
            const newQuiz = updater(prev.quiz);
            const newHistory = [...prev.history.slice(0, prev.historyIndex + 1), newQuiz];
            return {
                ...prev,
                quiz: newQuiz,
                isDirty: true,
                history: newHistory.slice(-50), // Keep last 50 states
                historyIndex: Math.min(newHistory.length - 1, 49),
            };
        });
    }, []);

    const selectQuestion = useCallback((questionId: string | null) => {
        setState(prev => ({ ...prev, selectedQuestionId: questionId }));
    }, []);

    const setViewportMode = useCallback((mode: ViewportMode) => {
        setState(prev => ({ ...prev, viewportMode: mode }));
    }, []);

    const addQuestion = useCallback((question: Question) => {
        updateQuiz(quiz => ({
            ...quiz,
            questions: [...quiz.questions, question],
        }));
        selectQuestion(question.id);
    }, [updateQuiz, selectQuestion]);

    const updateQuestion = useCallback((questionId: string, updates: Partial<Question>) => {
        updateQuiz(quiz => ({
            ...quiz,
            questions: quiz.questions.map(q =>
                q.id === questionId ? { ...q, ...updates } : q
            ),
        }));
    }, [updateQuiz]);

    const deleteQuestion = useCallback((questionId: string) => {
        updateQuiz(quiz => ({
            ...quiz,
            questions: quiz.questions.filter(q => q.id !== questionId),
        }));
        selectQuestion(null);
    }, [updateQuiz, selectQuestion]);

    const reorderQuestions = useCallback((fromIndex: number, toIndex: number) => {
        updateQuiz(quiz => {
            const questions = [...quiz.questions];
            const [removed] = questions.splice(fromIndex, 1);
            questions.splice(toIndex, 0, removed);
            return {
                ...quiz,
                questions: questions.map((q, idx) => ({ ...q, order: idx })),
            };
        });
    }, [updateQuiz]);

    const undo = useCallback(() => {
        setState(prev => {
            if (prev.historyIndex <= 0) return prev;
            return {
                ...prev,
                quiz: prev.history[prev.historyIndex - 1],
                historyIndex: prev.historyIndex - 1,
                isDirty: true,
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState(prev => {
            if (prev.historyIndex >= prev.history.length - 1) return prev;
            return {
                ...prev,
                quiz: prev.history[prev.historyIndex + 1],
                historyIndex: prev.historyIndex + 1,
                isDirty: true,
            };
        });
    }, []);

    const markClean = useCallback(() => {
        setState(prev => ({ ...prev, isDirty: false }));
    }, []);

    const selectedQuestion = state.quiz?.questions.find(
        q => q.id === state.selectedQuestionId
    ) || null;

    const canUndo = state.historyIndex > 0;
    const canRedo = state.historyIndex < state.history.length - 1;

    return {
        quiz: state.quiz,
        selectedQuestion,
        selectedQuestionId: state.selectedQuestionId,
        viewportMode: state.viewportMode,
        isDirty: state.isDirty,
        canUndo,
        canRedo,
        updateQuiz,
        selectQuestion,
        setViewportMode,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        reorderQuestions,
        undo,
        redo,
        markClean,
    };
}
