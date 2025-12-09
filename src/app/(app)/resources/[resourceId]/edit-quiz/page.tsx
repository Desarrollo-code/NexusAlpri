// src/app/(app)/resources/[resourceId]/edit-quiz/page.tsx
'use client';

import { InteractiveContentStudio } from '@/components/resources/interactive-quiz-editor';
import { useTitle } from '@/contexts/title-context';
import { Skeleton } from '@/components/ui/skeleton';
import React, { Suspense, useEffect } from 'react';

const EditorSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6">
        <div className="lg:col-span-3 space-y-4">
           <Skeleton className="h-24 w-full" />
           <Skeleton className="h-[calc(100vh-20rem)] w-full" />
        </div>
        <div className="lg:col-span-6 space-y-4">
            <Skeleton className="w-full aspect-video rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-3">
            <Skeleton className="w-full h-full min-h-[400px] rounded-lg" />
        </div>
    </div>
);

function EditQuizPageComponent({ params }: { params: { resourceId: string } }) {
    const { setPageTitle } = useTitle();

    useEffect(() => {
        setPageTitle('Estudio de Contenido Interactivo');
    }, [setPageTitle]);

    return <InteractiveContentStudio resourceId={params.resourceId} />;
}

export default function EditQuizPage({ params }: { params: { resourceId: string } }) {
    return (
        <Suspense fallback={<EditorSkeleton />}>
            <EditQuizPageComponent params={params} />
        </Suspense>
    );
}
