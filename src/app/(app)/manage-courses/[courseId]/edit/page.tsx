// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// CourseEditor sigue siendo un Client Component, por lo que se carga dinámicamente.
const CourseEditor = dynamic(
  () => import('@/components/course-editor-form').then(mod => mod.CourseEditor),
  { 
    ssr: false, // Se mantiene la deshabilitación de SSR para el editor en sí.
    loading: () => (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
