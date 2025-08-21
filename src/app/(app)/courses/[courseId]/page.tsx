// src/app/(app)/courses/[courseId]/page.tsx
import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CourseViewer } from '@/components/course-viewer';
import type { Course as AppCourse, CourseProgress } from '@/types';
import { getCurrentUser } from '@/lib/auth';

// This is now a Server Component that fetches data and passes it to the client component.

async function getCourseData(courseId: string): Promise<AppCourse | null> {
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

async function getEnrollmentAndProgress(userId: string, courseId: string): Promise<{ isEnrolled: boolean; progress: CourseProgress | null }> {
    const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { progress: { include: { completedLessons: true } } }
    });

    if (!enrollment) {
        return { isEnrolled: false, progress: null };
    }

    const progressData = enrollment.progress ? {
        ...enrollment.progress,
        completedLessons: enrollment.progress.completedLessons.map(record => ({
            lessonId: record.lessonId,
            type: record.type as 'view' | 'quiz',
            score: record.score ?? null,
        })),
    } : null;

    return { isEnrolled: true, progress: progressData };
}

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;
  const courseData = await getCourseData(courseId);
  const session = await getCurrentUser();

  if (!courseData) {
    notFound();
  }

  let enrollmentData = { isEnrolled: false, progress: null };
  if(session?.id) {
      enrollmentData = await getEnrollmentAndProgress(session.id, courseId);
  }

  // Pass initial data to the client component. It will handle the rest.
  return (
    <CourseViewer 
        initialCourse={courseData} 
        initialEnrollmentStatus={enrollmentData.isEnrolled}
        initialProgress={enrollmentData.progress}
    />
  );
}
