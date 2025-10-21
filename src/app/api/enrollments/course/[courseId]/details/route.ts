// src/app/api/enrollments/course/[courseId]/details/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay, subDays, format, endOfDay, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { courseId } = params;
        const { searchParams } = new URL(req.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                 modules: {
                    select: { id: true, title: true, order: true, lessons: { select: { id: true, title: true, order: true } } },
                    orderBy: { order: 'asc' }
                },
                _count: {
                    select: { 
                        enrollments: true,
                    },
                },
                enrollments: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                        progress: { 
                            include: { 
                                completedLessons: {
                                   select: { lessonId: true, type: true, score: true, completedAt: true }
                                }
                            }
                        }
                    },
                     orderBy: {
                        user: {
                            name: 'asc'
                        }
                    }
                }
            }
        });

        if (!course) {
            return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
        }
        
        const totalLessons = course.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);

        const allProgressRecords = course.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null && p !== undefined) as number[];
        const avgProgress = allProgressRecords.length > 0 ? allProgressRecords.reduce((a, b) => a + b, 0) / allProgressRecords.length : 0;
        
        const allQuizAttempts = await prisma.quizAttempt.findMany({
            where: { quiz: { contentBlock: { lesson: { module: { courseId: courseId } } } } },
            select: { score: true }
        });
        const avgQuizScore = allQuizAttempts.length > 0 ? allQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / allQuizAttempts.length : 0;

        const enrollmentsWithDetails = await Promise.all(course.enrollments.map(async (enrollment) => {
            const progress = enrollment.progress;
            if (!progress) {
                return { 
                    ...enrollment, 
                    progress: { 
                        progressPercentage: 0,
                        lastActivity: null,
                        completedAt: null,
                        completedLessons: [],
                        avgQuizScore: null,
                    }
                };
            }

            const userQuizAttempts = await prisma.quizAttempt.findMany({
                where: {
                    userId: enrollment.userId,
                    quiz: { contentBlock: { lesson: { module: { courseId } } } }
                },
                select: { score: true }
            });

            const userAvgQuizScore = userQuizAttempts.length > 0 ?
                userQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / userQuizAttempts.length
                : null;

            const lastActivity = progress.completedLessons.length > 0 
                ? new Date(Math.max(...progress.completedLessons.map(cl => new Date(cl.completedAt).getTime())))
                : null;
            
            return {
                ...enrollment,
                progress: {
                    ...progress,
                    progressPercentage: progress.progressPercentage,
                    avgQuizScore: userAvgQuizScore,
                    lastActivity
                }
            }
        }));

        // --- Completion Trend Logic ---
        const startDate = startDateParam && isValid(new Date(startDateParam)) ? startOfDay(new Date(startDateParam)) : startOfDay(subDays(new Date(), 29));
        const endDate = endDateParam && isValid(new Date(endDateParam)) ? endOfDay(new Date(endDateParam)) : endOfDay(new Date());

        const completions = await prisma.courseProgress.findMany({
            where: {
                courseId: courseId,
                completedAt: {
                    gte: startDate,
                    lte: endDate,
                }
            },
            select: { completedAt: true }
        });

        const completionTrendMap = new Map<string, number>();
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            completionTrendMap.set(format(d, 'yyyy-MM-dd'), 0);
        }

        completions.forEach(c => {
            if(c.completedAt) {
                const dateKey = format(c.completedAt, 'yyyy-MM-dd');
                if (completionTrendMap.has(dateKey)) {
                    completionTrendMap.set(dateKey, completionTrendMap.get(dateKey)! + 1);
                }
            }
        });
        const completionTrend = Array.from(completionTrendMap.entries()).map(([date, count]) => ({ date, count }));
        
        
        // --- Lesson Completions Logic (Friction Points) ---
        const allLessonsFlat = course.modules.flatMap(m => m.lessons);
        let lessonCompletions: { lessonId: string, title: string, completions: number }[] = [];

        if (allLessonsFlat.length > 0) {
            const lessonCompletionCounts = await prisma.lessonCompletionRecord.groupBy({
                by: ['lessonId'],
                where: {
                    lessonId: { in: allLessonsFlat.map(l => l.id) },
                    progress: { courseId: courseId }
                },
                _count: { lessonId: true }
            });

            const completionMap = new Map(lessonCompletionCounts.map(l => [l.lessonId, l._count.lessonId]));
            lessonCompletions = allLessonsFlat.map(lesson => ({
                lessonId: lesson.id,
                title: lesson.title,
                completions: completionMap.get(lesson.id) || 0
            }));
        }


        const response = {
            ...course,
            enrollments: enrollmentsWithDetails,
            _count: {
              ...course._count,
              lessons: totalLessons,
            },
            avgProgress: Math.round(avgProgress),
            avgQuizScore: Math.round(avgQuizScore),
            completionTrend,
            lessonCompletions,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('[COURSE_ENROLLMENT_DETAILS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los detalles del curso' }, { status: 500 });
    }
}
