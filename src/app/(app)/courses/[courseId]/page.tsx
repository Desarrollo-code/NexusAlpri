// src/app/(app)/courses/[courseId]/page.tsx
import React from 'react';
import { CourseViewer } from '@/components/course-viewer';

// This is now a simple Server Component that only extracts the courseId
// and passes it to the client component. The client component will handle fetching.

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  // The CourseViewer component will handle all data fetching and logic.
  return (
    <CourseViewer courseId={courseId} />
  );
}
