// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import { CourseEditor } from '@/components/course-editor-form';
import React from 'react';

// Server Component que solo extrae el courseId
export default async function EditCourseServerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  // El CourseEditor maneja la lógica interna
  return <CourseEditor courseId={courseId} />;
}
