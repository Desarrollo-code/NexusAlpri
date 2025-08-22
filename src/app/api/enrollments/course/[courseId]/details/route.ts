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
                _count: {
                    select: { 
                        enrollments: true,
                        modules: {
                            include: {
                                lessons: true
                            }
                        }
                    },
                },
                enrollments: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } },
                        progress: { select: { progressPercentage: true } }
                    }
                }
            }
        });

        if (!course) {
            return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
        }
        
        // Calculate total lessons for the course
        const modulesWithLessons = await prisma.module.findMany({
            where: { courseId: courseId },
            include: { _count: { select: { lessons: true } } }
        });
        const totalLessons = modulesWithLessons.reduce((sum, module) => sum + module._count.lessons, 0);

        // Calculate average progress
        const progressRecords = course.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null && p !== undefined) as number[];
        const avgProgress = progressRecords.length > 0 ? progressRecords.reduce((a, b) => a + b, 0) / progressRecords.length : 0;
        
        // Calculate average quiz score
        const quizAttempts = await prisma.quizAttempt.findMany({
            where: { quiz: { contentBlock: { lesson: { module: { courseId: courseId } } } } },
            select: { score: true }
        });
        const avgQuizScore = quizAttempts.length > 0 ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length : 0;

        const response = {
            ...course,
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
