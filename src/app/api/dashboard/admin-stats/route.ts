// src/app/api/dashboard/admin-stats/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay, parseISO, format, eachDayOfInterval } from 'date-fns';
import type { UserRole, CourseStatus, AdminDashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

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
    
    // --- Individual Queries with Safe Fallbacks ---
    const totalUsers = await safeQuery(prisma.user.count(), 0, 'totalUsers');
    const totalCourses = await safeQuery(prisma.course.count(), 0, 'totalCourses');
    const totalPublishedCourses = await safeQuery(prisma.course.count({ where: { status: 'PUBLISHED' } }), 0, 'totalPublishedCourses');
    const totalEnrollments = await safeQuery(prisma.enrollment.count(), 0, 'totalEnrollments');
    const totalResources = await safeQuery(prisma.enterpriseResource.count(), 0, 'totalResources');
    const totalAnnouncements = await safeQuery(prisma.announcement.count(), 0, 'totalAnnouncements');
    const totalForms = await safeQuery(prisma.form.count(), 0, 'totalForms');

    const usersByRole = await safeQuery(prisma.user.groupBy({ by: ['role'], _count: { id: true } }), [], 'usersByRole');
    const coursesByStatus = await safeQuery(prisma.course.groupBy({ by: ['status'], _count: { id: true } }), [], 'coursesByStatus');

    const sevenDaysAgo = subDays(new Date(), 7);
    const recentLogins = await safeQuery(prisma.securityLog.count({
        where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } },
        distinct: ['userId']
    }), 0, 'recentLogins');
    const newEnrollmentsLast7Days = await safeQuery(prisma.enrollment.count({ where: { enrolledAt: { gte: sevenDaysAgo } } }), 0, 'newEnrollmentsLast7Days');

    // --- Trend Calculation (with robust data handling) ---
    const userRegistrations = await safeQuery(prisma.user.findMany({
        where: { registeredDate: { gte: startDate, lte: endDate, not: null } }, // Explicitly exclude nulls
        select: { registeredDate: true }
    }), [], 'userRegistrations');

    const courseCreations = await safeQuery(prisma.course.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true }
    }), [], 'courseCreations');

    const enrollmentCreations = await safeQuery(prisma.enrollment.findMany({
        where: { enrolledAt: { gte: startDate, lte: endDate } },
        select: { enrolledAt: true }
    }), [], 'enrollmentCreations');
    
    const dailyData = new Map<string, { registrations: number; newCourses: number; newEnrollments: number }>();
    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
    intervalDays.forEach(day => {
        dailyData.set(format(day, 'yyyy-MM-dd'), { registrations: 0, newCourses: 0, newEnrollments: 0 });
    });
    
    userRegistrations.forEach(reg => {
        if (reg.registeredDate) {
          const dayKey = format(reg.registeredDate, 'yyyy-MM-dd');
          if (dailyData.has(dayKey)) {
            dailyData.get(dayKey)!.registrations++;
          }
        }
    });

    courseCreations.forEach(course => {
        const dayKey = format(course.createdAt, 'yyyy-MM-dd');
        if(dailyData.has(dayKey)) {
            dailyData.get(dayKey)!.newCourses++;
        }
    });

    enrollmentCreations.forEach(enrollment => {
        const dayKey = format(enrollment.enrolledAt, 'yyyy-MM-dd');
        if(dailyData.has(dayKey)) {
            dailyData.get(dayKey)!.newEnrollments++;
        }
    });

    const userRegistrationTrend = Array.from(dailyData.entries()).map(([date, counts]) => ({ 
        date, 
        count: counts.registrations, 
        newCourses: counts.newCourses, 
        newEnrollments: counts.newEnrollments 
    }));


    // --- Rankings (More complex queries, handled safely) ---
    const topCoursesByEnrollment = await safeQuery(prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { enrollments: { _count: 'desc' } }, take: 5,
        select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } }
    }), [], 'topCoursesByEnrollment');

    const allCoursesWithProgress = await safeQuery(prisma.course.findMany({
        where: { status: 'PUBLISHED', enrollments: { some: {} } },
        include: { enrollments: { include: { progress: { select: { progressPercentage: true } } } } }
    }), [], 'allCoursesWithProgress');

    const completionRates = allCoursesWithProgress.map(course => {
        const validProgress = course.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null && p !== undefined) as number[];
        const rate = validProgress.length > 0 ? validProgress.reduce((acc, curr) => acc + curr, 0) / validProgress.length : 0;
        return { id: course.id, title: course.title, imageUrl: course.imageUrl, value: rate };
    });

    const topStudentsByEnrollment = await safeQuery(prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { enrollments: { _count: 'desc' } }, take: 5,
        select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } }
    }), [], 'topStudentsByEnrollment');

    const topStudentsByCompletionData = await safeQuery(prisma.courseProgress.groupBy({
        by: ['userId'], where: { progressPercentage: { gte: 100 } },
        _count: { _all: true }, orderBy: { _count: { userId: 'desc' } }, take: 5
    }), [], 'topStudentsByCompletionData');
    
    const topStudentIds = topStudentsByCompletionData.map(item => item.userId);
    const topStudentDetails = topStudentIds.length > 0 ? await safeQuery(prisma.user.findMany({
        where: { id: { in: topStudentIds } }, select: { id: true, name: true, avatar: true }
    }), [], 'topStudentDetails') : [];
    
    const topStudentsByCompletion = topStudentsByCompletionData.map(data => {
        const userDetail = topStudentDetails.find(u => u.id === data.userId);
        return { id: data.userId, name: userDetail?.name || null, avatar: userDetail?.avatar || null, value: data._count._all };
    }).sort((a,b) => b.value - a.value);

    const topInstructorsByCourses = await safeQuery(prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        orderBy: { courses: { _count: 'desc' } }, take: 5,
        select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } }
    }), [], 'topInstructorsByCourses');
    
    const responsePayload: AdminDashboardStats = {
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments, totalResources, totalAnnouncements, totalForms,
        usersByRole: usersByRole.map(group => ({ role: group.role, count: group._count.id })),
        coursesByStatus: coursesByStatus.map(group => ({ status: group.status, count: group._count.id })),
        recentLogins, newEnrollmentsLast7Days, userRegistrationTrend,
        averageCompletionRate: completionRates.length > 0 ? completionRates.reduce((acc, curr) => acc + curr.value, 0) / completionRates.length : 0,
        topCoursesByEnrollment: topCoursesByEnrollment.map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments })),
        topCoursesByCompletion: [...completionRates].sort((a, b) => b.value - a.value).slice(0, 5),
        lowestCoursesByCompletion: [...completionRates].sort((a, b) => a.value - b.value).slice(0, 5),
        topStudentsByEnrollment: topStudentsByEnrollment.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments })),
        topStudentsByCompletion,
        topInstructorsByCourses: topInstructorsByCourses.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courses })),
    };

    return NextResponse.json(responsePayload);
}

    