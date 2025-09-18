
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
        console.error(`A safeQuery in admin-stats failed:`, error);
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
        const totalUsersPromise = safeQuery(prisma.user.count(), 0);
        const totalCoursesPromise = safeQuery(prisma.course.count(), 0);
        const totalPublishedCoursesPromise = safeQuery(prisma.course.count({ where: { status: 'PUBLISHED' } }), 0);
        const totalEnrollmentsPromise = safeQuery(prisma.enrollment.count(), 0);
        const totalResourcesPromise = safeQuery(prisma.enterpriseResource.count(), 0);
        const totalAnnouncementsPromise = safeQuery(prisma.announcement.count(), 0);
        const totalFormsPromise = safeQuery(prisma.form.count(), 0);


        // --- Groupings ---
        const usersByRolePromise = safeQuery(prisma.user.groupBy({ by: ['role'], _count: { id: true } }), []);
        const coursesByStatusPromise = safeQuery(prisma.course.groupBy({ by: ['status'], _count: { id: true } }), []);
        
        // --- Time-based Stats ---
        const sevenDaysAgo = subDays(new Date(), 7);
        const recentLoginsPromise = safeQuery(prisma.securityLog.count({
            where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } },
            distinct: ['userId']
        }), 0);
        const newEnrollmentsLast7DaysPromise = safeQuery(prisma.enrollment.count({ where: { enrolledAt: { gte: sevenDaysAgo } } }), 0);
        
        // --- Course and User Rankings ---
        const topCoursesByEnrollmentPromise = safeQuery(prisma.course.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { enrollments: { _count: 'desc' } },
            take: 5,
            select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } }
        }), []);

        const allCoursesWithProgressPromise = safeQuery(prisma.course.findMany({
            where: { status: 'PUBLISHED', enrollments: { some: {} } },
            include: { enrollments: { include: { progress: { select: { progressPercentage: true } } } } }
        }), []);

        const topStudentsByEnrollmentPromise = safeQuery(prisma.user.findMany({
            where: { role: 'STUDENT' },
            orderBy: { enrollments: { _count: 'desc' } },
            take: 5,
            select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } }
        }), []);

        const topStudentsByCompletionDataPromise = safeQuery(prisma.courseProgress.groupBy({
            by: ['userId'],
            where: { progressPercentage: { gte: 100 } },
            _count: { userId: true },
            orderBy: { _count: { userId: 'desc' } },
            take: 5
        }), []);
        
        const topInstructorsByCoursesPromise = safeQuery(prisma.user.findMany({
            where: { role: 'INSTRUCTOR' },
            orderBy: { courses: { _count: 'desc' } },
            take: 5,
            select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } }
        }), []);
        
        const userRegistrationsPromise = safeQuery(prisma.user.findMany({
            where: { registeredDate: { gte: startDate, lte: endDate, not: null } },
            select: { registeredDate: true }
        }), []);

        const [
            totalUsers, totalCourses, totalPublishedCourses, totalEnrollments, totalResources, totalAnnouncements, totalForms,
            usersByRole, coursesByStatus,
            recentLogins, newEnrollmentsLast7Days,
            userRegistrations,
            topCoursesByEnrollment,
            allCoursesWithProgress,
            topStudentsByEnrollment,
            topStudentsByCompletionData,
            topInstructorsByCourses
        ] = await Promise.all([
            totalUsersPromise, totalCoursesPromise, totalPublishedCoursesPromise, totalEnrollmentsPromise, totalResourcesPromise, totalAnnouncementsPromise, totalFormsPromise,
            usersByRolePromise, coursesByStatusPromise,
            recentLoginsPromise, newEnrollmentsLast7DaysPromise,
            userRegistrationsPromise,
            topCoursesByEnrollmentPromise,
            allCoursesWithProgressPromise,
            topStudentsByEnrollmentPromise,
            topStudentsByCompletionDataPromise,
            topInstructorsByCoursesPromise,
        ]);
        
        const dailyRegistrations = new Map<string, number>();
        const intervalDays = eachDayOfInterval({ start, end: endDate });
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
            return { id: data.userId, name: userDetail?.name, avatar: userDetail?.avatar, value: data._count.userId };
        }).sort((a,b) => b.value - a.value);
        
        const responsePayload: AdminDashboardStats = {
            totalUsers,
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            totalResources,
            totalAnnouncements,
            totalForms,
            usersByRole: usersByRole.map(group => ({ role: group.role, count: group._count.id })),
            coursesByStatus: coursesByStatus.map(group => ({ status: group.status, count: group._count.id })),
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
