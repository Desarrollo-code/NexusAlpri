
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { CourseAnalyticsData, LessonCompletionRecord, Course as AppCourse } from '@/types';
import type { JsonValue } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        // 1. Average Completion Rate
        const progressData = await prisma.courseProgress.findMany({
            select: { progressPercentage: true }
        });
        const averageCompletionRate = progressData.length > 0
            ? progressData.reduce((acc, p) => acc + p.progressPercentage, 0) / progressData.length
            : 0;
            
        // 2. Average Quiz Score
        const allProgressRecords = await prisma.courseProgress.findMany({
            where: {
                completedLessonIds: { not: { equals: '[]' } }
            },
            select: { completedLessonIds: true }
        });

        const quizScores: number[] = [];
        allProgressRecords.forEach(record => {
            if (record.completedLessonIds && Array.isArray(record.completedLessonIds)) {
                const completedRecords = record.completedLessonIds as unknown as LessonCompletionRecord[];
                completedRecords.forEach(completion => {
                    if (completion.type === 'quiz' && typeof completion.score === 'number') {
                        quizScores.push(completion.score);
                    }
                });
            }
        });
        
        const averageQuizScore = quizScores.length > 0
            ? quizScores.reduce((acc, score) => acc + score, 0) / quizScores.length
            : 0;

        // 3. Most Enrolled Courses (Top 5) - Now fetching full course data
        const mostEnrolledCoursesData = await prisma.course.findMany({
            take: 5,
            orderBy: {
                enrollments: { _count: 'desc' }
            },
            include: {
                instructor: { select: { id: true, name: true } },
                _count: {
                    select: { modules: true, enrollments: true }
                }
            }
        });
        const mostEnrolledCourses = mostEnrolledCoursesData.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description || '',
            instructor: c.instructor?.name || 'N/A',
            instructorId: c.instructorId || undefined,
            imageUrl: c.imageUrl,
            modulesCount: c._count.modules,
            status: c.status,
            modules: [], // Not needed for card
            category: c.category || undefined,
            isEnrolled: false, // Default for analytics view
        })) as AppCourse[];

        // 4. Course Distribution by Category
        const coursesByCategoryData = await prisma.course.groupBy({
            by: ['category'],
            _count: {
                category: true
            },
            orderBy: {
                _count: {
                    category: 'desc'
                }
            }
        });
        const coursesByCategory = coursesByCategoryData.map(c => ({
            category: c.category || 'Sin categoría',
            count: c._count.category
        }));

        const analyticsData: CourseAnalyticsData = {
            averageCompletionRate,
            averageQuizScore,
            mostEnrolledCourses,
            coursesByCategory,
        };

        return NextResponse.json(analyticsData);

    } catch (error) {
        console.error('[ANALYTICS_COURSES_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las analíticas de cursos' }, { status: 500 });
    }
}
