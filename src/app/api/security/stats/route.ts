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

        const results = await Promise.allSettled([
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'FAILED_LOGIN_ATTEMPT', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'USER_ROLE_CHANGED', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { userAgent: true, createdAt: true } }),
        ]);

        const successfulLogins24h = results[0].status === 'fulfilled' ? results[0].value : 0;
        const failedLogins24h = results[1].status === 'fulfilled' ? results[1].value : 0;
        const roleChanges24h = results[2].status === 'fulfilled' ? results[2].value : 0;
        const allSecurityLogs = results[3].status === 'fulfilled' ? results[3].value : [];
        
        // Log errors for debugging if any promises were rejected
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Error en la consulta de estadísticas de seguridad [${index}]:`, result.reason);
            }
        });

        const loginsByDayMap = new Map<string, number>();
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
            });
        }
        
        const loginsLast7Days = Array.from(loginsByDayMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        const criticalEvents24h = failedLogins24h + roleChanges24h;

        const stats: SecurityStats = {
            successfulLogins24h,
            failedLogins24h,
            roleChanges24h,
            criticalEvents24h,
            loginsLast7Days,
            topBrowsers: [], // Temporalmente deshabilitado
            topOS: [],       // Temporalmente deshabilitado
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("[SECURITY_STATS_API_ERROR]", error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas de seguridad' }, { status: 500 });
    }
}
