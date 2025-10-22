// src/app/api/security/stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay } from 'date-fns';
import type { SecurityStats } from '@/types';
import { parseUserAgent } from '@/lib/security-log-utils';

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
        browsers: toSortedArray(browserCounts),
        os: toSortedArray(osCounts),
    };
};


export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const [
            successfulLogins24h,
            failedLogins24h,
            roleChanges24h,
            allLogsForDeviceStats,
            topIpsResult,
        ] = await Promise.allSettled([
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'FAILED_LOGIN_ATTEMPT', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'USER_ROLE_CHANGED', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.findMany({ 
                select: { userAgent: true },
            }),
            prisma.securityLog.groupBy({
                by: ['ipAddress'],
                _count: { ipAddress: true },
                where: {
                    ipAddress: { not: null }, // Filtrar registros sin IP
                    createdAt: { gte: subDays(new Date(), 30) }
                },
                orderBy: { _count: { ipAddress: 'desc' } },
                take: 5,
            }),
        ]);
        
        const getResult = <T>(promise: PromiseSettledResult<T>, fallback: T): T => 
            promise.status === 'fulfilled' ? promise.value : fallback;

        const { browsers, os } = aggregateByUserAgent(getResult(allLogsForDeviceStats, []));
        const topIps = getResult(topIpsResult, []);
        
        const stats: SecurityStats = {
            successfulLogins24h: getResult(successfulLogins24h, 0),
            failedLogins24h: getResult(failedLogins24h, 0),
            roleChanges24h: getResult(roleChanges24h, 0),
            browsers,
            os,
            topIps: topIps as any,
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("[SECURITY_STATS_API_ERROR]", error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas de seguridad' }, { status: 500 });
    }
}
