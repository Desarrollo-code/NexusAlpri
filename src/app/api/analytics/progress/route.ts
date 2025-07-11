
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
        const completedEnrollments = await prisma.courseProgress.findMany({
            where: { progressPercentage: { gte: 95 } },
            include: {
                enrollment: {
                    select: { enrolledAt: true }
                }
            }
        });

        let totalCompletionDays = 0;
        let validCompletions = 0;
        completedEnrollments.forEach(p => {
            if (p.enrollment && p.updatedAt) {
                totalCompletionDays += differenceInDays(p.updatedAt, p.enrollment.enrolledAt);
                validCompletions++;
            }
        });
        
        const averageCompletionTimeDays = validCompletions > 0 ? Math.round(totalCompletionDays / validCompletions) : 0;
        
        // 4. Dropout rate (Placeholder logic)
        const dropoutRate = 12.5; // Placeholder value

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
