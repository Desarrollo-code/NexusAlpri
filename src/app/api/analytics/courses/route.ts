
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { CourseAnalyticsData } from '@/types';

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
        const quizScores = await prisma.lessonCompletionRecord.findMany({
            where: { type: 'quiz', score: { not: null } },
            select: { score: true }
        });
        const averageQuizScore = quizScores.length > 0
            ? quizScores.reduce((acc, q) => acc + (q.score || 0), 0) / quizScores.length
            : 0;

        // 3. Most Enrolled Courses (Top 5)
        const mostEnrolledCoursesData = await prisma.course.findMany({
            take: 5,
            orderBy: {
                enrollments: { _count: 'desc' }
            },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            }
        });
        const mostEnrolledCourses = mostEnrolledCoursesData.map(c => ({
            id: c.id,
            title: c.title,
            enrollments: c._count.enrollments
        }));

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
