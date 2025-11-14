// src/app/(app)/forms/[formId]/results/page.tsx
'use client';
import { FormResultsView } from '@/components/forms/form-results-view';
import { useTitle } from '@/contexts/title-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ResultsSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </div>
);

function FormResultsPageComponent({ formId }: { formId: string }) {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Resultados del Formulario');
  }, [setPageTitle]);
  
  return (
     <div className="space-y-6">
        <header className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold font-headline">Resultados del Formulario</h1>
            <Button variant="outline" size="sm" asChild>
                <Link href="/forms"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Formularios</Link>
            </Button>
        </header>
        <FormResultsView formId={formId} />
    </div>
  );
}

export default function FormResultsPage({ params }: { params: { formId: string } }) {
    const { formId } = params;
    return (
        <Suspense fallback={<ResultsSkeleton />}>
            <FormResultsPageComponent formId={formId} />
        </Suspense>
    )
}
