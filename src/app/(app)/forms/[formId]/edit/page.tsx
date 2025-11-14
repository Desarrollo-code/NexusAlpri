// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const FormEditor = dynamic(
  () => import('@/components/forms/form-editor').then(mod => mod.FormEditor),
  { 
    ssr: false,
    loading: () => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                    <Skeleton className="h-10 w-72" />
                    <Skeleton className="h-5 w-96 mt-2" />
                 </div>
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                 </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-56 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    )
  }
);

// La página ahora es un Server Component, lo que es más robusto.
// Los parámetros se reciben directamente como props.
export default function EditFormPage({ params }: { params: { formId: string } }) {
  const { formId } = params;

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FormEditor formId={formId} />
    </Suspense>
  );
}
