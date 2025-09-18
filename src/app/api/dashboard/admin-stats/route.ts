// src/app/api/dashboard/admin-stats/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay, parseISO, format, eachDayOfInterval } from 'date-fns';
import type { UserRole, CourseStatus, AdminDashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

async function safeQuery<T>(query: Promise<T>, fallback: T): Promise<T> {
    try {
        return await query;
    } catch (error) {
        console.error("A safeQuery in admin-stats failed:", error);
        return fallback;
    }
}

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const endDate = endDateParam ? endOfDay(parseISO(endDateParam)) : endOfDay(new Date());
    const startDate = startDateParam ? startOfDay(parseISO(startDateParam)) : startOfDay(subDays(endDate, 29));
    
    try {
        // --- Basic Counts ---
        const totalUsersPromise = prisma.user.count();
        const totalCoursesPromise = prisma.course.count();
        const totalPublishedCoursesPromise = prisma.course.count({ where: { status: 'PUBLISHED' } });
        const totalEnrollmentsPromise = prisma.enrollment.count();

        // --- Groupings ---
        const usersByRolePromise = prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
        const coursesByStatusPromise = prisma.course.groupBy({ by: ['status'], _count: { _all: true } });
        
        // --- Time-based Stats ---
        const sevenDaysAgo = subDays(new Date(), 7);
        const recentLoginsPromise = prisma.securityLog.count({
            where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } },
            distinct: ['userId']
        });
        const newEnrollmentsLast7DaysPromise = prisma.enrollment.count({ where: { enrolledAt: { gte: sevenDaysAgo } } });
        
        // --- Course and User Rankings ---
        const topCoursesByEnrollmentPromise = prisma.course.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { enrollments: { _count: 'desc' } },
            take: 5,
            select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } }
        });

        const allCoursesWithProgressPromise = prisma.course.findMany({
            where: { status: 'PUBLISHED', enrollments: { some: {} } },
            include: { enrollments: { include: { progress: { select: { progressPercentage: true } } } } }
        });

        const topStudentsByEnrollmentPromise = prisma.user.findMany({
            where: { role: 'STUDENT' },
            orderBy: { enrollments: { _count: 'desc' } },
            take: 5,
            select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } }
        });

        const topStudentsByCompletionDataPromise = prisma.courseProgress.groupBy({
            by: ['userId'],
            where: { progressPercentage: { gte: 100 } },
            _count: { _all: true },
            orderBy: { _count: { userId: 'desc' } },
            take: 5
        });

        const topInstructorsByCoursesPromise = prisma.user.findMany({
            where: { role: 'INSTRUCTOR' },
            orderBy: { courses: { _count: 'desc' } },
            take: 5,
            select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } }
        });

        // --- User Registration Trend (CORRECTED LOGIC) ---
        const userRegistrationsPromise = prisma.user.findMany({
            where: { registeredDate: { gte: startDate, lte: endDate, not: null } },
            select: { registeredDate: true }
        });

        const [
            totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
            usersByRole, coursesByStatus,
            recentLogins, newEnrollmentsLast7Days,
            userRegistrations,
            topCoursesByEnrollment,
            allCoursesWithProgress,
            topStudentsByEnrollment,
            topStudentsByCompletionData,
            topInstructorsByCourses
        ] = await Promise.all([
            safeQuery(totalUsersPromise, 0),
            safeQuery(totalCoursesPromise, 0),
            safeQuery(totalPublishedCoursesPromise, 0),
            safeQuery(totalEnrollmentsPromise, 0),
            safeQuery(usersByRolePromise, []),
            safeQuery(coursesByStatusPromise, []),
            safeQuery(recentLoginsPromise, 0),
            safeQuery(newEnrollmentsLast7DaysPromise, 0),
            safeQuery(userRegistrationsPromise, []),
            safeQuery(topCoursesByEnrollmentPromise, []),
            safeQuery(allCoursesWithProgressPromise, []),
            safeQuery(topStudentsByEnrollmentPromise, []),
            safeQuery(topStudentsByCompletionDataPromise, []),
            safeQuery(topInstructorsByCoursesPromise, []),
        ]);

        const dailyRegistrations = new Map<string, number>();
        const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
        intervalDays.forEach(day => { dailyRegistrations.set(format(day, 'yyyy-MM-dd'), 0); });
        userRegistrations.forEach(reg => {
            if (reg.registeredDate) {
              const dayKey = format(reg.registeredDate, 'yyyy-MM-dd');
              if (dailyRegistrations.has(dayKey)) {
                dailyRegistrations.set(dayKey, (dailyRegistrations.get(dayKey) || 0) + 1);
              }
            }
        });
        const userRegistrationTrend = Array.from(dailyRegistrations.entries()).map(([date, count]) => ({ date, count }));
        
        const completionRates = allCoursesWithProgress.map(course => {
            const completedCount = course.enrollments.filter(e => e.progress?.progressPercentage && e.progress.progressPercentage >= 100).length;
            const rate = course.enrollments.length > 0 ? (completedCount / course.enrollments.length) * 100 : 0;
            return { id: course.id, title: course.title, imageUrl: course.imageUrl, value: rate };
        });

        const topStudentIds = topStudentsByCompletionData.map(item => item.userId);
        const topStudentDetails = topStudentIds.length > 0 ? await safeQuery(prisma.user.findMany({
            where: { id: { in: topStudentIds } },
            select: { id: true, name: true, avatar: true }
        }), []) : [];
        const topStudentsByCompletion = topStudentsByCompletionData.map(data => {
            const userDetail = topStudentDetails.find(u => u.id === data.userId);
            return { id: data.userId, name: userDetail?.name, avatar: userDetail?.avatar, value: data._count._all };
        }).sort((a,b) => b.value - a.value);
        
        const responsePayload: AdminDashboardStats = {
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole: usersByRole.map(group => ({ role: group.role, count: group._count._all })),
            coursesByStatus: coursesByStatus.map(group => ({ status: group.status, count: group._count._all })),
            recentLogins,
            newEnrollmentsLast7Days,
            userRegistrationTrend,
            averageCompletionRate: completionRates.length > 0 ? completionRates.reduce((acc, curr) => acc + curr.value, 0) / completionRates.length : 0,
            topCoursesByEnrollment: topCoursesByEnrollment.map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments })),
            topCoursesByCompletion: [...completionRates].sort((a, b) => b.value - a.value).slice(0, 5),
            lowestCoursesByCompletion: [...completionRates].sort((a, b) => a.value - b.value).slice(0, 5),
            topStudentsByEnrollment: topStudentsByEnrollment.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments })),
            topStudentsByCompletion,
            topInstructorsByCourses: topInstructorsByCourses.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courses })),
        };

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener estadísticas del dashboard' }, { status: 500 });
    }
}