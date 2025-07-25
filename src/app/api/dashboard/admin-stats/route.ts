

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserRole, CourseStatus } from '@/types';

type CourseInfo = {
    id: string;
    title: string;
    imageUrl: string | null;
    value: number;
}

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
    // New Advanced Stats
    averageCompletionRate: number;
    topCoursesByEnrollment: CourseInfo[];
    topCoursesByCompletion: CourseInfo[];
    lowestCoursesByCompletion: CourseInfo[];
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
            recentEnrollments,
            allCourseProgress,
            enrollmentsByCourse,
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
            prisma.course.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
            prisma.course.findMany({ where: { publicationDate: { gte: thirtyDaysAgo } }, select: { publicationDate: true } }),
            prisma.enrollment.findMany({ where: { enrolledAt: { gte: thirtyDaysAgo } }, select: { enrolledAt: true } }),
            // New queries for advanced stats
            prisma.courseProgress.findMany({
                select: { courseId: true, progressPercentage: true }
            }),
            prisma.course.findMany({
                select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } },
                where: { status: 'PUBLISHED' },
            }),
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
        
        dateRange30Days.forEach(day => {
            const key = format(day, 'yyyy-MM-dd');
            courseActivityMap[key] = { newCourses: 0, publishedCourses: 0, newEnrollments: 0 };
        });

        recentCourses.forEach(c => {
            const dateKey = format(c.createdAt, 'yyyy-MM-dd');
            if (courseActivityMap[dateKey]) {
                courseActivityMap[dateKey].newCourses++;
            }
        });
        recentPublishedCourses.forEach(c => {
            if(c.publicationDate) {
              const dateKey = format(c.publicationDate, 'yyyy-MM-dd');
              if (courseActivityMap[dateKey]) {
                courseActivityMap[dateKey].publishedCourses++;
              }
            }
        });
        recentEnrollments.forEach(e => {
            const dateKey = format(e.enrolledAt, 'yyyy-MM-dd');
            if (courseActivityMap[dateKey]) {
                courseActivityMap[dateKey].newEnrollments++;
            }
        });

        const courseActivity = Object.entries(courseActivityMap).map(([date, counts]) => ({
            date: format(new Date(date), 'MMM d', { locale: es }),
            ...counts
        }));

        // --- Advanced Course Stats ---
        const averageCompletionRate = allCourseProgress.length > 0
            ? allCourseProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / allCourseProgress.length
            : 0;

        const topCoursesByEnrollment = enrollmentsByCourse
            .sort((a, b) => b._count.enrollments - a._count.enrollments)
            .slice(0, 5)
            .map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));

        const completionRatesByCourse: Record<string, { total: number; count: number }> = {};
        allCourseProgress.forEach(p => {
            if (!completionRatesByCourse[p.courseId]) {
                completionRatesByCourse[p.courseId] = { total: 0, count: 0 };
            }
            completionRatesByCourse[p.courseId].total += p.progressPercentage;
            completionRatesByCourse[p.courseId].count++;
        });

        const averageCompletionRates = Object.entries(completionRatesByCourse).map(([courseId, data]) => ({
            courseId,
            avgRate: data.total / data.count,
        }));
        
        const coursesWithAvgRates = enrollmentsByCourse.map(course => ({
            ...course,
            avgCompletion: averageCompletionRates.find(c => c.courseId === course.id)?.avgRate || 0,
        }));
        
        const topCoursesByCompletion = coursesWithAvgRates
            .sort((a, b) => b.avgCompletion - a.avgCompletion)
            .slice(0, 5)
            .map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: Math.round(c.avgCompletion) }));
            
        const lowestCoursesByCompletion = coursesWithAvgRates
             .filter(c => c._count.enrollments > 0) // Only show courses with students
            .sort((a, b) => a.avgCompletion - b.avgCompletion)
            .slice(0, 5)
            .map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: Math.round(c.avgCompletion) }));


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
            averageCompletionRate: Math.round(averageCompletionRate),
            topCoursesByEnrollment,
            topCoursesByCompletion,
            lowestCoursesByCompletion
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}
