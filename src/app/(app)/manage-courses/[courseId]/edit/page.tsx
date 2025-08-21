// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import { CourseEditor } from '@/components/course-editor-form';
import React from 'react';

// This page is now a simple server component wrapper.
// It extracts the courseId from params and passes it to the client component.
// This avoids the "params should be awaited" error by simplifying the server-side logic.

export default async function EditCourseServerPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;

  // The CourseEditor component will handle all data fetching, state management, and logic.
  return <CourseEditor courseId={courseId} />;
}
