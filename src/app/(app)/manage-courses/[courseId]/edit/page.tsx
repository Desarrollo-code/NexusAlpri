// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const CourseEditor = dynamic(
  () => import('@/components/course-editor-form').then(mod => mod.CourseEditor),
  { 
    ssr: false,
    loading: () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info Skeleton */}
                    <Skeleton className="h-64 w-full rounded-xl" />
                    {/* Content Skeleton */}
                    <Skeleton className="h-96 w-full rounded-xl" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    {/* Publication Skeleton */}
                    <Skeleton className="h-80 w-full rounded-xl" />
                    {/* Category & Image Skeleton */}
                    <Skeleton className="h-72 w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
  }
);

// La página ahora es un Server Component, lo que es más robusto.
// Los parámetros se reciben directamente como props.
export default function EditCoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  // Pasamos el courseId como una prop normal al editor.
  return <CourseEditor courseId={courseId} />;
}
