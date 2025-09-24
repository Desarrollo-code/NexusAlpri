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
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        totalResources, totalAnnouncements, totalForms,
        usersByRole, coursesByStatus,
        recentLogins, newEnrollmentsLast7Days,
        recentAnnouncements, securityLogs
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
            take: 2, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true } }, 
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }), [], 'recentAnnouncements'),
        safeQuery(prisma.securityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }), [], 'securityLogs')
    ]);

    // --- Trend Calculation for Charts ---
    const [userRegistrations, courseCreations, enrollmentCreations] = await Promise.all([
        safeQuery(prisma.user.findMany({ where: { registeredDate: { gte: startDate, lte: endDate, not: null } }, select: { registeredDate: true } }), [], 'userRegistrations'),
        safeQuery(prisma.course.findMany({ where: { createdAt: { gte: startDate, lte: endDate } }, select: { createdAt: true } }), [], 'courseCreations'),
        safeQuery(prisma.enrollment.findMany({ where: { enrolledAt: { gte: startDate, lte: endDate } }, select: { enrolledAt: true } }), [], 'enrollmentCreations'),
    ]);

    const dailyData = new Map<string, { count: number; newCourses: number; newEnrollments: number }>();
    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
    intervalDays.forEach(day => { dailyData.set(format(day, 'yyyy-MM-dd'), { count: 0, newCourses: 0, newEnrollments: 0 }); });
    userRegistrations.forEach(reg => { if (reg.registeredDate) { const dayKey = format(reg.registeredDate, 'yyyy-MM-dd'); if (dailyData.has(dayKey)) dailyData.get(dayKey)!.count++; } });
    courseCreations.forEach(course => { const dayKey = format(course.createdAt, 'yyyy-MM-dd'); if(dailyData.has(dayKey)) dailyData.get(dayKey)!.newCourses++; });
    enrollmentCreations.forEach(enrollment => { const dayKey = format(enrollment.enrolledAt, 'yyyy-MM-dd'); if(dailyData.has(dayKey)) dailyData.get(dayKey)!.newEnrollments++; });
    const userRegistrationTrend = Array.from(dailyData.entries()).map(([date, counts]) => ({ ...counts, date }));
    

    // --- Rankings for Analytics Page ---
    const allCoursesWithProgress = await safeQuery(prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        include: { _count: { select: { enrollments: true } }, enrollments: { select: { progress: { select: { progressPercentage: true } } } } }
    }), [], 'allCoursesWithProgress');

    const completionRates = allCoursesWithProgress.map(course => {
        const validProgress = course.enrollments.map(e => e.progress?.progressPercentage).filter((p): p is number => p !== null && p !== undefined);
        const rate = validProgress.length > 0 ? validProgress.reduce((acc, curr) => acc + curr, 0) / validProgress.length : 0;
        return { id: course.id, title: course.title, imageUrl: course.imageUrl, value: rate, enrollmentsCount: course._count.enrollments };
    });

    const averageCompletionRate = completionRates.length > 0 ? completionRates.reduce((acc, curr) => acc + curr.value, 0) / completionRates.length : 0;
    
    // Top Courses By Enrollment
    const topCoursesByEnrollment = [...completionRates].sort((a, b) => b.enrollmentsCount - a.enrollmentsCount).slice(0, 5);

    // Top & Low Courses By Completion
    const coursesWithEnrollment = completionRates.filter(c => c.enrollmentsCount > 0);
    const topCoursesByCompletion = [...coursesWithEnrollment].sort((a,b) => b.value - a.value).slice(0,5);
    const lowestCoursesByCompletion = [...coursesWithEnrollment].sort((a,b) => a.value - b.value).slice(0,5);

    // User Rankings
    const [topStudentsByEnrollment, topStudentsByCompletion, topInstructorsByCourses] = await Promise.all([
        safeQuery(prisma.user.findMany({
            where: { role: 'STUDENT', enrollments: { some: {} } },
            select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } },
            orderBy: { enrollments: { _count: 'desc' } }, take: 5
        }).then(users => users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments }))), [], 'topStudentsByEnrollment'),
        
        safeQuery(prisma.courseProgress.groupBy({
            by: ['userId'],
            where: { progressPercentage: 100 },
            _count: { courseId: true },
            orderBy: { _count: { courseId: 'desc' } }, take: 5
        }).then(async (groups) => {
            const userIds = groups.map(g => g.userId);
            if(userIds.length === 0) return [];
            const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, avatar: true } });
            return groups.map(g => {
                const user = users.find(u => u.id === g.userId);
                return { id: user!.id, name: user!.name, avatar: user!.avatar, value: g._count.courseId };
            });
        }), [], 'topStudentsByCompletion'),

        safeQuery(prisma.user.findMany({
            where: { role: 'INSTRUCTOR', courses: { some: {} } },
            select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } },
            orderBy: { courses: { _count: 'desc' } }, take: 5
        }).then(users => users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courses }))), [], 'topInstructorsByCourses')
    ]);
    
    // --- Final Payload ---
    const stats: AdminDashboardStats = {
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments, totalResources, totalAnnouncements, totalForms,
        usersByRole: usersByRole.map(group => ({ role: group.role as UserRole, count: group._count.id })),
        coursesByStatus: coursesByStatus.map(group => ({ status: group.status as CourseStatus, count: group._count.id })),
        recentLogins, newEnrollmentsLast7Days, userRegistrationTrend,
        averageCompletionRate, topCoursesByEnrollment, topCoursesByCompletion, lowestCoursesByCompletion,
        topStudentsByEnrollment, topStudentsByCompletion, topInstructorsByCourses
    };

    const dashboardData = {
        ...stats, // Flatten the stats object into the main response
        announcements: recentAnnouncements,
        logs: securityLogs as SecurityLogWithUser[]
    };

    return NextResponse.json(dashboardData);
}
