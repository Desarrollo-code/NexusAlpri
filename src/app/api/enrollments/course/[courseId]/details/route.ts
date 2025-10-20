// src/app/api/enrollments/course/[courseId]/details/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { courseId } = params;

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

        const response = {
            ...course,
            enrollments: enrollmentsWithDetails,
            _count: {
              ...course._count,
              lessons: totalLessons,
            },
            avgProgress: Math.round(avgProgress),
            avgQuizScore: Math.round(avgQuizScore)
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('[COURSE_ENROLLMENT_DETAILS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los detalles del curso' }, { status: 500 });
    }
}
