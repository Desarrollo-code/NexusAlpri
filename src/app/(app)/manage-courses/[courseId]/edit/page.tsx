// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import { CourseEditor } from '@/components/course-editor-form';
import prisma from '@/lib/prisma';
import type { Course as AppCourse } from '@/types';
import { notFound } from 'next/navigation';
import React from 'react';

// This page is now a pure Server Component responsible for fetching data.

async function getCourseData(courseId: string): Promise<AppCourse | null> {
  if (courseId === 'new') {
    return null; // Return null for a new course, the editor will handle defaults.
  }
  const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                contentBlocks: {
                  orderBy: { order: "asc" },
                  include: {
                    quiz: {
                      include: {
                        questions: {
                          orderBy: { order: "asc" },
                          include: {
                            options: { orderBy: { id: "asc" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!course) return null;
  
  // Basic transformation
  return {
    ...course,
    instructor: course.instructor?.name || 'N/A',
    publicationDate: course.publicationDate?.toISOString() || null,
    modules: course.modules.map(mod => ({
        ...mod,
        lessons: mod.lessons.map(less => ({
            ...less,
            contentBlocks: less.contentBlocks.map(block => ({
                ...block,
                quiz: block.quiz ? {
                    ...block.quiz,
                    questions: (block.quiz.questions || []).map(q => ({...q, options: q.options || []})),
                } : null
            }))
        }))
    })),
    modulesCount: course.modules.length,
  };
};


export default async function EditCourseServerPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;
  const courseData = await getCourseData(courseId);

  if (!courseData && courseId !== 'new') {
    notFound();
  }

  // The CourseEditor component receives the initial data directly as a prop.
  return <CourseEditor initialData={courseData} courseId={courseId} />;
}
