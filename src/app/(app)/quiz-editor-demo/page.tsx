// src/app/(app)/quiz-editor-demo/page.tsx
'use client';

import { useState } from 'react';
import { ProfessionalQuizEditor } from '@/components/quizz-it/professional-quiz-editor';
import { QuizViewer } from '@/components/quiz-viewer';
import type { Quiz } from '@/types';
import { generateUniqueId } from '@/lib/editor-utils';

export default function QuizEditorDemoPage() {
    const [quiz, setQuiz] = useState<Quiz>({
        id: generateUniqueId('quiz'),
        title: 'Mi Primer Quiz',
        description: 'Crea un quiz interactivo con el editor profesional',
        questions: [],
        maxAttempts: null,
        remedialContent: null,
    });

    const [showPreview, setShowPreview] = useState(false);

    const handleSave = (updatedQuiz: Quiz) => {
        setQuiz(updatedQuiz);
        console.log('Quiz guardado:', updatedQuiz);
    };

    const handlePreview = (previewQuiz: Quiz) => {
        setQuiz(previewQuiz);
        setShowPreview(true);
    };

    return (
        <>
            <ProfessionalQuizEditor
                quiz={quiz}
                onSave={handleSave}
                onPreview={handlePreview}
            />

            {showPreview && (
                <QuizViewer
                    quiz={quiz}
                    lessonId="demo"
                    isCreatorPreview
                    onQuizCompleted={() => setShowPreview(false)}
                />
            )}
        </>
    );
}
