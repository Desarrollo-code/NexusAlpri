// src/app/api/security/stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays } from 'date-fns';
import { parseUserAgent } from '@/lib/security-log-utils';
import type { SecurityStats } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const twentyFourHoursAgo = subDays(new Date(), 1);
        const sevenDaysAgo = subDays(new Date(), 7);

        // 1. Fetch all necessary data using Promise.allSettled for resilience
        const [
            successfulLoginsResult,
            failedLoginsResult,
            roleChangesResult,
            allSecurityLogsResult
        ] = await Promise.allSettled([
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'FAILED_LOGIN_ATTEMPT', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'USER_ROLE_CHANGED', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { userAgent: true, createdAt: true } }),
        ]);

        // 2. Safely process the results
        const successfulLogins24h = successfulLoginsResult.status === 'fulfilled' ? successfulLoginsResult.value : 0;
        const failedLogins24h = failedLoginsResult.status === 'fulfilled' ? failedLoginsResult.value : 0;
        const roleChanges24h = roleChangesResult.status === 'fulfilled' ? roleChangesResult.value : 0;
        const allSecurityLogs = allSecurityLogsResult.status === 'fulfilled' ? allSecurityLogsResult.value : [];
        
        // Log errors if any promises were rejected
        if (successfulLoginsResult.status === 'rejected') console.error("Error fetching successful logins:", successfulLoginsResult.reason);
        if (failedLoginsResult.status === 'rejected') console.error("Error fetching failed logins:", failedLoginsResult.reason);
        if (roleChangesResult.status === 'rejected') console.error("Error fetching role changes:", roleChangesResult.reason);
        if (allSecurityLogsResult.status === 'rejected') console.error("Error fetching all security logs:", allSecurityLogsResult.reason);


        // 3. Process logs for charts (now guaranteed to have a safe 'allSecurityLogs' array)
        const loginsByDayMap = new Map<string, number>();
        const browserCounts: { [key: string]: number } = {};
        const osCounts: { [key: string]: number } = {};

        // Initialize last 7 days in map
        for (let i = 0; i < 7; i++) {
            const d = subDays(new Date(), i);
            loginsByDayMap.set(d.toISOString().split('T')[0], 0);
        }
        
        if (Array.isArray(allSecurityLogs)) {
            allSecurityLogs.forEach(log => {
                const date = log.createdAt.toISOString().split('T')[0];
                if (loginsByDayMap.has(date)) {
                    loginsByDayMap.set(date, (loginsByDayMap.get(date) || 0) + 1);
                }

                const { browser, os } = parseUserAgent(log.userAgent);
                if (browser !== 'Desconocido') browserCounts[browser] = (browserCounts[browser] || 0) + 1;
                if (os !== 'Desconocido') osCounts[os] = (osCounts[os] || 0) + 1;
            });
        }
        
        const loginsLast7Days = Array.from(loginsByDayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        const topBrowsers = Object.entries(browserCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([browser, count]) => ({ browser, count }));
        const topOS = Object.entries(osCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([os, count]) => ({ os, count }));
        const criticalEvents24h = failedLogins24h + roleChanges24h;

        const stats: SecurityStats = {
            successfulLogins24h,
            failedLogins24h,
            roleChanges24h,
            criticalEvents24h,
            loginsLast7Days,
            topBrowsers,
            topOS,
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("[SECURITY_STATS_API_ERROR]", error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas de seguridad' }, { status: 500 });
    }
}
