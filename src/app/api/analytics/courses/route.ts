
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { CourseAnalyticsData, Course as AppCourse } from '@/types';

function mapPrismaCourseToAppCourse(prismaCourse: any): AppCourse {
    return {
        id: prismaCourse.id,
        title: prismaCourse.title,
        description: prismaCourse.description || '',
        instructor: prismaCourse.instructor?.name || 'N/A',
        instructorId: prismaCourse.instructorId || undefined,
        imageUrl: prismaCourse.imageUrl || undefined,
        modulesCount: prismaCourse._count?.modules ?? 0,
        status: prismaCourse.status,
        modules: [],
        isEnrolled: false
    };
}


export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const courseProgressData = await prisma.courseProgress.findMany({
            where: {
                progressPercentage: { gt: 0 }
            },
            select: {
                progressPercentage: true
            }
        });

        const totalProgressRecords = courseProgressData.length;
        const sumCompletionRate = courseProgressData.reduce((acc, curr) => acc + (curr.progressPercentage || 0), 0);
        const averageCompletionRate = totalProgressRecords > 0 ? sumCompletionRate / totalProgressRecords : 0;
        
        const quizScoresData = await prisma.lessonCompletionRecord.findMany({
            where: { type: 'quiz', score: { not: null } },
            select: { score: true }
        });
        const totalQuizzes = quizScoresData.length;
        const sumQuizScores = quizScoresData.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const averageQuizScore = totalQuizzes > 0 ? sumQuizScores / totalQuizzes : 0;
        

        const mostEnrolledCoursesQuery = prisma.course.findMany({
            where: {
                status: 'PUBLISHED'
            },
            include: {
                _count: {
                    select: { enrollments: true, modules: true },
                },
                instructor: {
                    select: { name: true }
                }
            },
            orderBy: {
                enrollments: {
                    _count: 'desc',
                },
            },
            take: 5,
        });

        const coursesByCategoryQuery = prisma.course.groupBy({
            by: ['category'],
            _count: {
                id: true,
            },
        });
        
        const [mostEnrolledCourses, coursesByCategory] = await prisma.$transaction([
            mostEnrolledCoursesQuery,
            coursesByCategoryQuery,
        ]);
        
        const appCourses = mostEnrolledCourses.map(mapPrismaCourseToAppCourse);

        const stats: CourseAnalyticsData = {
            averageCompletionRate,
            averageQuizScore,
            mostEnrolledCourses: appCourses,
            coursesByCategory: coursesByCategory.map(item => ({
                category: item.category || 'Sin Categoría',
                count: item._count.id,
            })),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[COURSES_ANALYTICS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las analíticas de cursos' }, { status: 500 });
    }
}
