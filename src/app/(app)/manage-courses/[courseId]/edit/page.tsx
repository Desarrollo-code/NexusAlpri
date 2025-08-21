// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import { CourseEditor } from '@/components/course-editor-form';
import React from 'react';

// This is now a simple Server Component that only extracts the courseId
// and passes it to the client component.

export default async function EditCourseServerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  // The CourseEditor component will handle all data fetching, state management, and logic.
  return <CourseEditor courseId={courseId} />;
}
