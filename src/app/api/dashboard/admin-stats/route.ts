
// src/app/api/dashboard/admin-stats/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay, parseISO, format, eachDayOfInterval } from 'date-fns';
import type { UserRole, CourseStatus, AdminDashboardStats, SecurityLog as AppSecurityLog } from '@/types';
import type { User as PrismaUser } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<PrismaUser, 'id' | 'name' | 'avatar'> | null;
}

// Helper function to safely execute a Prisma query and return a fallback on error.
async function safeQuery<T>(query: Promise<T>, fallback: T, queryName: string): Promise<T> {
    try {
        return await query;
    } catch (error) {
        console.error(`Error in safeQuery for [${queryName}]:`, error);
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
    
    // --- Dashboard Specific Data ---
    const sevenDaysAgo = subDays(new Date(), 7);

    const [
        totalUsers,
        totalCourses,
        totalPublishedCourses,
        totalEnrollments,
        totalResources,
        totalAnnouncements,
        totalForms,
        usersByRole,
        coursesByStatus,
        recentLogins,
        newEnrollmentsLast7Days,
        recentAnnouncements,
        securityLogs
    ] = await Promise.all([
        safeQuery(prisma.user.count(), 0, 'totalUsers'),
        safeQuery(prisma.course.count(), 0, 'totalCourses'),
        safeQuery(prisma.course.count({ where: { status: 'PUBLISHED' } }), 0, 'totalPublishedCourses'),
        safeQuery(prisma.enrollment.count(), 0, 'totalEnrollments'),
        safeQuery(prisma.enterpriseResource.count(), 0, 'totalResources'),
        safeQuery(prisma.announcement.count(), 0, 'totalAnnouncements'),
        safeQuery(prisma.form.count(), 0, 'totalForms'),
        safeQuery(prisma.user.groupBy({ by: ['role'], _count: { id: true } }), [], 'usersByRole'),
        safeQuery(prisma.course.groupBy({ by: ['status'], _count: { id: true } }), [], 'coursesByStatus'),
        safeQuery(prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } }, distinct: ['userId'] }), 0, 'recentLogins'),
        safeQuery(prisma.enrollment.count({ where: { enrolledAt: { gte: sevenDaysAgo } } }), 0, 'newEnrollmentsLast7Days'),
        safeQuery(prisma.announcement.findMany({
            take: 2,
            orderBy: { date: 'desc' },
            include: { author: { select: { id: true, name: true, avatar: true } }, attachments: true, reads: { select: { user: { select: { id: true, name: true, avatar: true } } } }, reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { reads: true } }, },
        }), [], 'recentAnnouncements'),
        safeQuery(prisma.securityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }), [], 'securityLogs')
    ]);

    // --- Trend Calculation for Charts (if needed on admin page) ---
    const userRegistrations = await safeQuery(prisma.user.findMany({
        where: { registeredDate: { gte: startDate, lte: endDate, not: null } }, select: { registeredDate: true }
    }), [], 'userRegistrations');
    const courseCreations = await safeQuery(prisma.course.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } }, select: { createdAt: true }
    }), [], 'courseCreations');
    const enrollmentCreations = await safeQuery(prisma.enrollment.findMany({
        where: { enrolledAt: { gte: startDate, lte: endDate } }, select: { enrolledAt: true }
    }), [], 'enrollmentCreations');

    const dailyData = new Map<string, { registrations: number; newCourses: number; newEnrollments: number }>();
    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
    intervalDays.forEach(day => { dailyData.set(format(day, 'yyyy-MM-dd'), { registrations: 0, newCourses: 0, newEnrollments: 0 }); });
    userRegistrations.forEach(reg => { if (reg.registeredDate) { const dayKey = format(reg.registeredDate, 'yyyy-MM-dd'); if (dailyData.has(dayKey)) dailyData.get(dayKey)!.registrations++; } });
    courseCreations.forEach(course => { const dayKey = format(course.createdAt, 'yyyy-MM-dd'); if(dailyData.has(dayKey)) dailyData.get(dayKey)!.newCourses++; });
    enrollmentCreations.forEach(enrollment => { const dayKey = format(enrollment.enrolledAt, 'yyyy-MM-dd'); if(dailyData.has(dayKey)) dailyData.get(dayKey)!.newEnrollments++; });
    const userRegistrationTrend = Array.from(dailyData.entries()).map(([date, counts]) => ({ date, count: counts.registrations, newCourses: counts.newCourses, newEnrollments: counts.newEnrollments }));

    // --- Rankings for Analytics Page (can be split later) ---
    const allCoursesWithProgress = await safeQuery(prisma.course.findMany({
        where: { status: 'PUBLISHED', enrollments: { some: {} } },
        include: { enrollments: { include: { progress: { select: { progressPercentage: true } } } } }
    }), [], 'allCoursesWithProgress');
    const completionRates = allCoursesWithProgress.map(course => {
        const validProgress = course.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null && p !== undefined) as number[];
        const rate = validProgress.length > 0 ? validProgress.reduce((acc, curr) => acc + curr, 0) / validProgress.length : 0;
        return { id: course.id, title: course.title, imageUrl: course.imageUrl, value: rate };
    });
    
    // Constructing the final stats payload
    const stats: AdminDashboardStats = {
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments, totalResources, totalAnnouncements, totalForms,
        usersByRole: usersByRole.map(group => ({ role: group.role, count: group._count.id })),
        coursesByStatus: coursesByStatus.map(group => ({ status: group.status, count: group._count.id })),
        recentLogins, newEnrollmentsLast7Days, userRegistrationTrend,
        averageCompletionRate: completionRates.length > 0 ? completionRates.reduce((acc, curr) => acc + curr.value, 0) / completionRates.length : 0,
        // The following are more for the analytics page but are calculated here for simplicity now
        topCoursesByEnrollment: [], topCoursesByCompletion: [], lowestCoursesByCompletion: [], topStudentsByEnrollment: [], topStudentsByCompletion: [], topInstructorsByCourses: []
    };

    return NextResponse.json({
        stats,
        announcements: recentAnnouncements,
        logs: securityLogs
    });
}
