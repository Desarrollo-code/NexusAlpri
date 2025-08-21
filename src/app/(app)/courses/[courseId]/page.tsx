// src/app/(app)/courses/[courseId]/page.tsx
import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CourseViewer } from '@/components/course-viewer';
import type { Course as AppCourse, CourseProgress } from '@/types';
import { getCurrentUser } from '@/lib/auth';

const transformPrismaToAppCourse = (prismaCourse: any): AppCourse => {
  return {
    ...prismaCourse,
    publicationDate: prismaCourse.publicationDate ? prismaCourse.publicationDate.toISOString() : null,
    instructor: prismaCourse.instructor?.name || 'N/A',
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

async function getCourseData(courseId: string) {
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
  return transformPrismaToAppCourse(course);
}

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

  return (
    <CourseViewer 
        initialCourse={courseData} 
        initialEnrollmentStatus={enrollmentData.isEnrolled}
        initialProgress={enrollmentData.progress}
    />
  );
}
