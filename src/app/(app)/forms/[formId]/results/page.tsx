// src/app/(app)/forms/[formId]/results/page.tsx
'use client';
import { FormResultsView } from '@/components/forms/form-results-view';
import { useTitle } from '@/contexts/title-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function FormResultsPage({ params }: { params: { formId: string } }) {
  const { formId } = params;
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
