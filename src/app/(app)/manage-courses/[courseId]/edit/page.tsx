// src/app/(app)/manage-courses/[courseId]/edit/page.tsx
import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CourseEditor } from '@/components/course-editor-form';
import type { Course as AppCourse, Module, Lesson, ContentBlock, Quiz } from '@/types';

// Helper para transformar datos de Prisma a tipos de la App
const transformPrismaToAppCourse = (prismaCourse: any): AppCourse => {
  return {
    ...prismaCourse,
    publicationDate: prismaCourse.publicationDate ? prismaCourse.publicationDate.toISOString() : null,
    modules: prismaCourse.modules.map((mod: any) => ({
      ...mod,
      lessons: mod.lessons.map((less: any) => ({
        ...less,
        contentBlocks: (less.contentBlocks || []).map((block: any) => ({
          ...block,
          quiz: block.quiz ? {
            ...block.quiz,
            questions: (block.quiz.questions || []).map((q: any) => ({
              ...q,
              options: q.options || [],
            })),
          } : null,
        })),
      })),
    })),
  };
};

async function getCourseData(courseId: string): Promise<AppCourse | null> {
  if (courseId === 'new') {
    return null; // Es un curso nuevo, no hay datos que cargar
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

  if (!course) {
    return null;
  }
  
  return transformPrismaToAppCourse(course);
}

export default async function EditCourseServerPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;
  const courseData = await getCourseData(courseId);

  if (!courseData && courseId !== 'new') {
    notFound();
  }

  return <CourseEditor initialData={courseData} courseId={courseId} />;
}
