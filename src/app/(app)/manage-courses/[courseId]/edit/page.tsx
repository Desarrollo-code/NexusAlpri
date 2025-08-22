// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Carga dinámica del editor de cursos para asegurar que se renderice solo en el cliente.
// Esto es crucial para componentes complejos con estado y DND para evitar conflictos de hidratación y renderizado.
const CourseEditor = dynamic(
  () => import('@/components/course-editor-form').then(mod => mod.CourseEditor),
  { 
    ssr: false, // Deshabilitar la renderización del lado del servidor para este componente
    loading: () => (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }
);

// Este componente ahora es un Client Component para poder usar 'dynamic' y React.use()
// para desenvolver la promesa de los parámetros.
export default function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  // Se utiliza React.use() para acceder a los parámetros de forma síncrona en un Client Component
  const { courseId } = React.use(params);

  // El CourseEditor maneja la lógica interna
  return <CourseEditor courseId={courseId} />;
}
