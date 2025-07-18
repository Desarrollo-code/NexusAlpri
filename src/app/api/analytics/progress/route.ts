
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { ProgressAnalyticsData } from '@/types';
import { subDays, differenceInDays } from 'date-fns';

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const sevenDaysAgo = subDays(new Date(), 7);

        // Active students are those who have made progress recently
        const activeStudentsInCourses = await prisma.courseProgress.count({
            where: {
                updatedAt: { gte: sevenDaysAgo },
            },
            distinct: ['userId'],
        });
        
        // Calculate average completion time
        const completedEnrollments = await prisma.enrollment.findMany({
            where: {
                progress: {
                    progressPercentage: 100
                }
            },
            include: {
                progress: true
            }
        });
        
        let totalCompletionDays = 0;
        let completedCount = 0;
        completedEnrollments.forEach(e => {
            if (e.progress?.updatedAt) {
                totalCompletionDays += differenceInDays(e.progress.updatedAt, e.enrolledAt);
                completedCount++;
            }
        });
        const averageCompletionTimeDays = completedCount > 0 ? totalCompletionDays / completedCount : 0;

        // Calculate dropout rate (enrolled but 0 progress after 7 days)
        const oldInactiveEnrollments = await prisma.enrollment.count({
            where: {
                enrolledAt: { lt: sevenDaysAgo },
                progress: null, // No progress record at all
            },
        });
        
        const totalEnrollments = await prisma.enrollment.count();
        const dropoutRate = totalEnrollments > 0 ? (oldInactiveEnrollments / totalEnrollments) * 100 : 0;

        const stats: ProgressAnalyticsData = {
            activeStudentsInCourses,
            averageCompletionTimeDays,
            dropoutRate,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[PROGRESS_ANALYTICS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las analíticas de progreso' }, { status: 500 });
    }
}
