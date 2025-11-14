// src/app/forms/[formId]/view/page.tsx
import { FormViewer } from '@/components/forms/form-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import React, { Suspense } from 'react';

const FormSkeleton = () => (
    <div className="max-w-3xl mx-auto my-8 space-y-8">
        <div className="text-center space-y-4">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
        </div>
        <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
    </div>
);

export default function ViewFormPage({ params }: { params: { formId: string } }) {
  const { formId } = params;

  return (
    <Suspense fallback={<FormSkeleton />}>
        <FormViewer formId={formId} />
    </Suspense>
  );
}
