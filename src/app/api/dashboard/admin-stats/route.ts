

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserRole, CourseStatus } from '@/types';

export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
    recentLogins: number; // Active users in last 7 days
    newUsersLast7Days: number;
    userRegistrationTrend: { date: string, count: number }[];
    courseActivity: { date: string, newCourses: number, publishedCourses: number, newEnrollments: number }[];
}

export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const sevenDaysAgo = subDays(new Date(), 7);

        const [
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole,
            coursesByStatus,
            recentLoginsResult,
            newUsersLast7Days,
            recentUsers,
            recentCourses,
            recentPublishedCourses,
            recentEnrollments
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count(),
            prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { status: true } }),
            prisma.securityLog.groupBy({
                by: ['userId'],
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } },
            }),
            prisma.user.count({
                where: { registeredDate: { gte: sevenDaysAgo } }
            }),
            prisma.user.findMany({
                where: { registeredDate: { gte: startOfDay(sevenDaysAgo) }},
                select: { registeredDate: true }
            }),
            // Course activity last 30 days
            prisma.course.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
            prisma.course.findMany({ where: { publicationDate: { gte: thirtyDaysAgo } }, select: { publicationDate: true } }),
            prisma.enrollment.findMany({ where: { enrolledAt: { gte: thirtyDaysAgo } }, select: { enrolledAt: true } })
        ]);
        
        // --- User Registration Trend (Last 7 days) ---
        const dateRange7Days = eachDayOfInterval({ start: sevenDaysAgo, end: new Date() });
        const registrationsByDate: Record<string, number> = {};
        for (const user of recentUsers) {
            if (user.registeredDate) {
                const dateKey = format(new Date(user.registeredDate), 'yyyy-MM-dd');
                registrationsByDate[dateKey] = (registrationsByDate[dateKey] || 0) + 1;
            }
        }
        const userRegistrationTrend = dateRange7Days.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            return {
                date: format(date, 'MMM d', { locale: es }),
                count: registrationsByDate[dateKey] || 0,
            };
        });

        // --- Course Activity (Last 30 days) ---
        const dateRange30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
        const courseActivityMap: Record<string, { newCourses: number, publishedCourses: number, newEnrollments: number }> = {};
        
        const initializeDate = (dateKey: string) => {
            if (!courseActivityMap[dateKey]) {
                courseActivityMap[dateKey] = { newCourses: 0, publishedCourses: 0, newEnrollments: 0 };
            }
        };

        recentCourses.forEach(c => {
            const dateKey = format(c.createdAt, 'yyyy-MM-dd');
            initializeDate(dateKey);
            courseActivityMap[dateKey].newCourses++;
        });
        recentPublishedCourses.forEach(c => {
            if(c.publicationDate) {
              const dateKey = format(c.publicationDate, 'yyyy-MM-dd');
              initializeDate(dateKey);
              courseActivityMap[dateKey].publishedCourses++;
            }
        });
        recentEnrollments.forEach(e => {
            const dateKey = format(e.enrolledAt, 'yyyy-MM-dd');
            initializeDate(dateKey);
            courseActivityMap[dateKey].newEnrollments++;
        });

        const courseActivity = dateRange30Days.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            return {
                date: format(date, 'MMM d', { locale: es }),
                ...(courseActivityMap[dateKey] || { newCourses: 0, publishedCourses: 0, newEnrollments: 0 })
            };
        });


        const stats: AdminDashboardStats = {
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole: usersByRole.map(item => ({
                role: item.role as UserRole,
                count: item._count.role,
            })),
            coursesByStatus: coursesByStatus.map(item => ({
                status: item.status as CourseStatus,
                count: item._count.status,
            })),
            recentLogins: recentLoginsResult.length,
            newUsersLast7Days: newUsersLast7Days,
            userRegistrationTrend,
            courseActivity,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}
