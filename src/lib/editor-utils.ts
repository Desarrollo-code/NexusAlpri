// src/lib/editor-utils.ts

import type { Question } from '@/types';

export function generateUniqueId(prefix: string = 'item'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateQuestion(question: Question): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!question.text || question.text.trim().length === 0) {
        errors.push('La pregunta debe tener texto');
    }

    if (question.options.length < 2) {
        errors.push('Debe haber al menos 2 opciones');
    }

    const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer && question.type !== 'OPEN_ENDED') {
        errors.push('Debe haber al menos una respuesta correcta');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function calculateQuestionCompleteness(question: Question): number {
    let score = 0;
    let total = 5;

    // Has text
    if (question.text && question.text.trim().length > 0) score++;

    // Has enough options
    if (question.options.length >= 2) score++;

    // Has correct answer
    if (question.options.some(opt => opt.isCorrect)) score++;

    // Options have text
    const allOptionsHaveText = question.options.every(
        opt => opt.text && opt.text.trim().length > 0
    );
    if (allOptionsHaveText) score++;

    // Has image (optional bonus)
    if (question.imageUrl) score++;

    return (score / total) * 100;
}

export function getViewportWidth(mode: 'mobile' | 'tablet' | 'desktop'): string {
    switch (mode) {
        case 'mobile':
            return '375px';
        case 'tablet':
            return '768px';
        case 'desktop':
            return '100%';
        default:
            return '100%';
    }
}

export function getQuestionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        MULTIPLE_CHOICE: 'Múltiple Elección',
        SINGLE_CHOICE: 'Elección Única',
        TRUE_FALSE: 'Verdadero/Falso',
        OPEN_ENDED: 'Respuesta Abierta',
    };
    return labels[type] || type;
}

export function getQuestionTypeColor(type: string): string {
    const colors: Record<string, string> = {
        MULTIPLE_CHOICE: 'from-blue-500 to-cyan-500',
        SINGLE_CHOICE: 'from-green-500 to-emerald-500',
        TRUE_FALSE: 'from-purple-500 to-pink-500',
        OPEN_ENDED: 'from-orange-500 to-red-500',
    };
    return colors[type] || 'from-gray-500 to-gray-600';
}
