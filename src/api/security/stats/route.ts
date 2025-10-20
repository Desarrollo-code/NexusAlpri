// src/app/api/security/stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay } from 'date-fns';
import type { SecurityStats } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

        const [
            successfulLogins24h,
            failedLogins24h,
            roleChanges24h,
            loginData,
        ] = await Promise.all([
            prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'FAILED_LOGIN_ATTEMPT', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.count({ where: { event: 'USER_ROLE_CHANGED', createdAt: { gte: twentyFourHoursAgo } } }),
            prisma.securityLog.groupBy({
                by: ['createdAt'],
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } },
                _count: { id: true },
                orderBy: { createdAt: 'asc' },
            }),
        ]);

        const loginsByDayMap = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
            const d = subDays(new Date(), i);
            loginsByDayMap.set(d.toISOString().split('T')[0], 0);
        }
        
        loginData.forEach(log => {
            const date = log.createdAt.toISOString().split('T')[0];
            if (loginsByDayMap.has(date)) {
                loginsByDayMap.set(date, (loginsByDayMap.get(date) || 0) + 1);
            }
        });
        
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
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("[SECURITY_STATS_API_ERROR]", error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas de seguridad' }, { status: 500 });
    }
}
