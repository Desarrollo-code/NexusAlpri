// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import { CourseEditor } from '@/components/course-editor-form';
import React from 'react';

// This is now a simple Server Component that only extracts the courseId
// and passes it to the client component.

<<<<<<< HEAD
export default async function EditCourseServerPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;

  // The CourseEditor component will handle all data fetching, state management, and logic.
  return <CourseEditor courseId={courseId} />;
=======
export default async function EditCourseServerPage(props: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await props.params; // 👈 aquí esperas params

  const courseData = await getCourseData(courseId);

  if (!courseData && courseId !== 'new') {
    notFound();
  }

  return <CourseEditor initialData={courseData} courseId={courseId} />;
>>>>>>> b80a6d7 (.)
}
