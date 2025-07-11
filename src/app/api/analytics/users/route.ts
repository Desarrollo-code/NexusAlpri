
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserRole, UserAnalyticsData, UsersByRole } from '@/types';

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = startOfDay(subDays(today, 29));
        const sevenDaysAgo = startOfDay(subDays(today, 6));

        // 1. Get user count by role
        const usersByRoleData = await prisma.user.groupBy({
            by: ['role'],
            _count: { role: true },
        });

        const usersByRole: UsersByRole[] = usersByRoleData.map(item => ({
            role: item.role as UserRole,
            count: item._count.role,
        }));

        // 2. Get active users in the last 7 days
        // Correction: Use findMany with distinct to count unique users
        const distinctUserLogins = await prisma.securityLog.findMany({
            where: {
                event: 'SUCCESSFUL_LOGIN',
                createdAt: { gte: sevenDaysAgo },
                user: {
                  isNot: null // This ensures the related user exists
                }
            },
            select: {
                userId: true,
            },
            distinct: ['userId'],
        });
        const activeUsersLast7Days = distinctUserLogins.length;


        // 3. Get new user registrations for the last 30 days
        const newUsersData = await prisma.user.groupBy({
            by: ['registeredDate'],
            _count: { id: true },
            where: {
                registeredDate: {
                    gte: thirtyDaysAgo,
                },
            },
        });
        
        // Create a map of registration counts by date string 'yyyy-MM-dd'
        const registrationsMap = new Map<string, number>();
        newUsersData.forEach(item => {
            if (item.registeredDate) {
                const dateKey = format(item.registeredDate, 'yyyy-MM-dd');
                registrationsMap.set(dateKey, item._count.id);
            }
        });

        // Generate all dates for the last 30 days to ensure a complete chart
        const allDates = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
        const newUsersLast30Days = allDates.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            return {
                date: format(date, 'MMM d', { locale: es }),
                count: registrationsMap.get(dateKey) || 0,
            };
        });

        const analyticsData: UserAnalyticsData = {
            usersByRole,
            activeUsersLast7Days,
            newUsersLast30Days,
        };

        return NextResponse.json(analyticsData);

    } catch (error) {
        console.error('[ANALYTICS_USERS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las analíticas de usuarios' }, { status: 500 });
    }
}
