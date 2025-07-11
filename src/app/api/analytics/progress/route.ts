
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { ProgressAnalyticsData } from '@/types';
import { differenceInDays } from 'date-fns';

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        // 1. Certificates Issued (completed courses)
        const certificatesIssued = await prisma.courseProgress.count({
            where: {
                progressPercentage: {
                    gte: 95, // Assuming 95% or more is a completion
                },
            },
        });
        
        // 2. Students with courses in progress
        const activeStudentsInCourses = await prisma.courseProgress.count({
            where: {
                progressPercentage: {
                    gt: 0,
                    lt: 95,
                }
            },
            distinct: ['userId']
        });
        
        // 3. Average time to completion
        const completedProgressRecords = await prisma.courseProgress.findMany({
            where: { 
                progressPercentage: { gte: 95 },
                // Ensure the associated enrollment exists to prevent errors
                enrollment: {
                    isNot: null,
                }
            },
            include: {
                enrollment: {
                    select: { enrolledAt: true }
                }
            }
        });

        let totalCompletionDays = 0;
        let validCompletions = 0;
        completedProgressRecords.forEach(p => {
            // This check is now safer due to the query above
            if (p.enrollment && p.updatedAt) {
                totalCompletionDays += differenceInDays(p.updatedAt, p.enrollment.enrolledAt);
                validCompletions++;
            }
        });
        
        const averageCompletionTimeDays = validCompletions > 0 ? Math.round(totalCompletionDays / validCompletions) : 0;
        
        // 4. Dropout rate (estimated)
        const totalEnrollments = await prisma.enrollment.count();
        const coursesStarted = await prisma.courseProgress.count({ where: { progressPercentage: { gt: 0 } } });
        const coursesNotCompleted = await prisma.courseProgress.count({ where: { progressPercentage: { gt: 0, lt: 95 } } });
        
        const dropoutRate = coursesStarted > 0 ? (coursesNotCompleted / coursesStarted) * 100 : 0;

        const analyticsData: ProgressAnalyticsData = {
            certificatesIssued,
            activeStudentsInCourses,
            averageCompletionTimeDays,
            dropoutRate,
        };

        return NextResponse.json(analyticsData);

    } catch (error) {
        console.error('[ANALYTICS_PROGRESS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las analíticas de progreso' }, { status: 500 });
    }
}
