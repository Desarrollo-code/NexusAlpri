// src/app/(app)/courses/[courseId]/page.tsx
import React from 'react';
import { CourseViewer } from '@/components/course-viewer';

// Este es un Server Component, por lo que los parámetros se reciben directamente.
export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;

  // El CourseViewer es un Client Component que manejará la lógica de fetching.
  return <CourseViewer courseId={courseId} />;
}
