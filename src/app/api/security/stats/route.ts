// src/app/api/security/stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { SecurityStats } from '@/types';
import { parseUserAgent } from '@/lib/security-log-utils';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

const aggregateByUserAgent = (logs: { userAgent: string | null }[]) => {
    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};

    logs.forEach(log => {
        const { browser, os } = parseUserAgent(log.userAgent);
        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
        osCounts[os] = (osCounts[os] || 0) + 1;
    });
    
    const toSortedArray = (counts: Record<string, number>) => Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return {
        browsers: toSortedArray(browserCounts).slice(0, 5), // Top 5
        os: toSortedArray(osCounts).slice(0, 5),
    };
};


export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let dateFilter: any = {};
    if (startDateParam && endDateParam) {
        try {
            dateFilter.createdAt = {
                gte: startOfDay(new Date(startDateParam)),
                lte: endOfDay(new Date(endDateParam)),
            };
        } catch(e) {
            // Ignore invalid dates
        }
    }


    try {
        const [
            successfulLogins,
            failedLogins,
            roleChanges,
            allLogsForDeviceStats,
        ] = await Promise.all([
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', ...dateFilter } }),
            prisma.securityLog.count({ where: { event: 'FAILED_LOGIN_ATTEMPT', ...dateFilter } }),
            prisma.securityLog.count({ where: { event: 'USER_ROLE_CHANGED', ...dateFilter } }),
            prisma.securityLog.findMany({ 
                where: dateFilter,
                select: { userAgent: true },
                take: 1000, // Limit analysis to 1000 logs for performance
            }),
        ]);
        
        const { browsers, os } = aggregateByUserAgent(allLogsForDeviceStats || []);
        
        const stats: Partial<SecurityStats> = {
            successfulLogins,
            failedLogins,
            roleChanges,
            browsers,
            os,
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("[SECURITY_STATS_API_ERROR]", error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas de seguridad' }, { status: 500 });
    }
}
