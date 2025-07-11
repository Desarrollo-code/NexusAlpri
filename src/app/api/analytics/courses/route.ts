
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { CourseAnalyticsData, LessonCompletionRecord } from '@/types';
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
        // Correctly fetch all progress records and then iterate through the JSON field
        const allProgressRecords = await prisma.courseProgress.findMany({
            where: {
                completedLessonIds: { not: { equals: '[]' } } // Optimization: only fetch records with completions
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
