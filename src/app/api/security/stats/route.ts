// src/app/api/security/stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay, isValid, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseUserAgent } from '@/lib/security-log-utils';
import type { SecurityLogEvent } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const today = endOfDay(new Date());
        const last7DaysStart = startOfDay(subDays(today, 6));

        // 1. Get all logs from the last 7 days safely
        const allLogs = await prisma.securityLog.findMany({
            where: {
                createdAt: {
                    gte: last7DaysStart,
                },
            },
            select: {
                event: true,
                createdAt: true,
                userAgent: true,
            },
        });
        
        // 2. Safely process the data
        const browserCounts: Record<string, number> = {};
        const osCounts: Record<string, number> = {};
        const eventsLast24h: Record<SecurityLogEvent, number> = {
            SUCCESSFUL_LOGIN: 0,
            FAILED_LOGIN_ATTEMPT: 0,
            PASSWORD_CHANGE_SUCCESS: 0,
            TWO_FACTOR_ENABLED: 0,
            TWO_FACTOR_DISABLED: 0,
            USER_ROLE_CHANGED: 0,
        };

        const yesterday = subDays(today, 1);
        
        // CORRECCIÓN: Crear el mapa de tendencias de forma robusta
        const trendMap = new Map<string, { SUCCESSFUL_LOGIN: number; FAILED_LOGIN_ATTEMPT: number }>();
        for (let i = 0; i < 7; i++) {
            const date = subDays(today, i);
            const dateKey = format(date, 'yyyy-MM-dd');
            trendMap.set(dateKey, { SUCCESSFUL_LOGIN: 0, FAILED_LOGIN_ATTEMPT: 0 });
        }


        allLogs.forEach(log => {
            // CORRECCIÓN: Validar que la fecha del log es válida antes de usarla
            if (!log.createdAt || !isValid(new Date(log.createdAt))) {
                return;
            }
            const logDate = new Date(log.createdAt);

            // Tally events in the last 24 hours
            if (logDate >= yesterday) {
                const eventType = log.event as SecurityLogEvent;
                if (eventsLast24h[eventType] !== undefined) {
                    eventsLast24h[eventType]++;
                }
            }

            // Tally event trend
            const dateKey = format(logDate, 'yyyy-MM-dd');
            const trendEntry = trendMap.get(dateKey);
            if (trendEntry) {
                const eventType = log.event as SecurityLogEvent;
                if (eventType === 'SUCCESSFUL_LOGIN' || eventType === 'FAILED_LOGIN_ATTEMPT') {
                    trendEntry[eventType]++;
                }
            }
            
            // Tally User Agent distribution
            const { browser, os } = parseUserAgent(log.userAgent || 'Unknown');
            if (browser !== 'Desconocido') {
                browserCounts[browser] = (browserCounts[browser] || 0) + 1;
            }
            if (os !== 'Desconocido') {
                osCounts[os] = (osCounts[os] || 0) + 1;
            }
        });

        const formattedEventTrend = Array.from(trendMap.entries())
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const formattedBrowserDistribution = Object.entries(browserCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
        const formattedOsDistribution = Object.entries(osCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);

        return NextResponse.json({
            totalEvents: allLogs.length,
            eventsLast24h: Object.entries(eventsLast24h).map(([type, count]) => ({ type, count })),
            eventTrend: formattedEventTrend,
            browserDistribution: formattedBrowserDistribution,
            osDistribution: formattedOsDistribution,
        });

    } catch (error) {
        console.error('[SECURITY_STATS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas de seguridad' }, { status: 500 });
    }
}
