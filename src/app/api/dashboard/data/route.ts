// src/app/api/dashboard/data/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus, AdminDashboardStats, EnrolledCourse, Course, Announcement, CalendarEvent } from '@/types';
import type { User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { subDays, startOfDay, endOfDay, isValid, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths } from 'date-fns';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { expandRecurringEvents } from '@/lib/calendar-utils';
import { parseUserAgent } from '@/lib/security-log-utils';

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

async function getAdminDashboardData(session: PrismaUser, startDate?: Date, endDate?: Date) {
    const activityEndDate = endDate || new Date();
    const activityStartDate = startDate || subDays(activityEndDate, 29);

    const [
        stats,
        recentLogins,
        newEnrollmentsLast7Days,
        newCoursesTrend,
        newEnrollmentsTrend,
        newUsersTrend,
        coursesWithProgress,
        instructorsWithCourseCounts,
        studentsWithData,
        recentAnnouncements,
        securityLogs,
        baseInteractiveEvents,
    ] = await prisma.$transaction([
        prisma.user.groupBy({ by: ['role'], _count: { role: true }, where: startDate ? { registeredDate: { gte: startDate, lte: activityEndDate } } : undefined }),
        prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: subDays(new Date(), 7) } }, distinct: ['userId'] }),
        prisma.enrollment.count({ where: { enrolledAt: { gte: subDays(new Date(), 7) } } }),
        prisma.course.groupBy({ by: ['createdAt'], _count: { _all: true }, where: { createdAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { createdAt: 'asc' } }),
        prisma.enrollment.groupBy({ by: ['enrolledAt'], _count: { _all: true }, where: { enrolledAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { enrolledAt: 'asc' } }),
        prisma.user.groupBy({ by: ['registeredDate'], _count: { _all: true }, where: { registeredDate: { gte: activityStartDate, lte: activityEndDate } } }),
        prisma.course.findMany({ where: { status: 'PUBLISHED' }, include: { _count: { select: { enrollments: true } }, enrollments: { select: { progress: { select: { progressPercentage: true } } } } } }),
        prisma.user.findMany({ where: { role: 'INSTRUCTOR' }, include: { _count: { select: { courses: true } } } }),
        prisma.user.findMany({ where: { role: 'STUDENT' }, include: { _count: { select: { enrollments: true, courseProgress: { where: { progressPercentage: 100 } } } } } }),
        prisma.announcement.findMany({ take: 2, orderBy: { date: 'desc' }, include: { author: { select: { id: true, name: true, avatar: true, role: true } }, attachments: true, reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { reads: true, reactions: true } } } }),
        prisma.securityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }),
        prisma.calendarEvent.findMany({ where: { isInteractive: true } }),
    ]);

    const usersByRole = stats;

    const activityMap = new Map<string, { newCourses: number, newEnrollments: number, count: number }>();
    for (let d = new Date(activityStartDate); d <= activityEndDate; d.setDate(d.getDate() + 1)) {
        activityMap.set(d.toISOString().split('T')[0], { newCourses: 0, newEnrollments: 0, count: 0 });
    }
    newCoursesTrend.forEach(item => { const date = item.createdAt.toISOString().split('T')[0]; if (activityMap.has(date)) activityMap.get(date)!.newCourses += item._count._all; });
    newEnrollmentsTrend.forEach(item => { const date = item.enrolledAt.toISOString().split('T')[0]; if (activityMap.has(date)) activityMap.get(date)!.newEnrollments += item._count._all; });
    newUsersTrend.forEach(item => { 
        if (item.registeredDate) {
            const date = item.registeredDate.toISOString().split('T')[0]; 
            if (activityMap.has(date)) activityMap.get(date)!.count += item._count._all;
        }
    });
    const userRegistrationTrend = Array.from(activityMap.entries()).map(([date, counts]) => ({ date, ...counts }));
    
    // --- Interactive Events ---
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const expandedInteractiveEventsToday = expandRecurringEvents(baseInteractiveEvents, todayStart, todayEnd);
    const userParticipationsToday = await prisma.eventParticipation.findMany({
        where: { userId: session.id, occurrenceDate: { gte: todayStart, lte: todayEnd } }
    });
    
    const participationsSet = new Set(userParticipationsToday.map(p => `${p.eventId}-${p.occurrenceDate.toISOString().split('T')[0]}`));
    const interactiveEventsToday = expandedInteractiveEventsToday.map(event => ({
        ...event,
        hasParticipated: participationsSet.has(`${event.parentId || event.id}-${new Date(event.start).toISOString().split('T')[0]}`)
    }));
    
    const completionRates = coursesWithProgress.map(c => { const validProgresses = c.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null) as number[]; return validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0; }).filter(rate => rate > 0);
    const averageCompletionRate = completionRates.length > 0 ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length : 0;
    const topCoursesByEnrollment = [...coursesWithProgress].sort((a, b) => b._count.enrollments - a._count.enrollments).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));
    const courseCompletionData = coursesWithProgress.map(c => { const validProgresses = c.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null) as number[]; const avg = validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0; return { id: c.id, title: c.title, imageUrl: c.imageUrl, value: avg }; });
    const topCoursesByCompletion = [...courseCompletionData].filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
    const lowestCoursesByCompletion = [...courseCompletionData].filter(c => c.value > 0).sort((a, b) => a.value - b.value).slice(0, 5);
    const topStudentsByEnrollment = [...studentsWithData].sort((a,b) => b._count.enrollments - a._count.enrollments).slice(0,5).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments }));
    const topStudentsByCompletion = [...studentsWithData].sort((a,b) => b._count.courseProgress - a._count.courseProgress).slice(0,5).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courseProgress }));
    const topInstructorsByCourses = [...instructorsWithCourseCounts].sort((a, b) => b._count.courses - a._count.courses).slice(0, 5).map(i => ({ id: i.id, name: i.name, avatar: i.avatar, value: i._count.courses }));

    const adminStats: AdminDashboardStats = {
        totalUsers: (await prisma.user.count({ where: startDate ? { registeredDate: { gte: startDate, lte: activityEndDate } } : undefined })) || 0,
        totalCourses: (await prisma.course.count({ where: startDate ? { createdAt: { gte: startDate, lte: activityEndDate } } : undefined })) || 0,
        totalPublishedCourses: (await prisma.course.count({ where: { status: 'PUBLISHED', ...(startDate && { createdAt: { gte: startDate, lte: activityEndDate } }) } })) || 0,
        totalEnrollments: (await prisma.enrollment.count({ where: startDate ? { enrolledAt: { gte: startDate, lte: activityEndDate } } : undefined })) || 0,
        totalResources: (await prisma.enterpriseResource.count({ where: startDate ? { uploadDate: { gte: startDate, lte: activityEndDate } } : undefined })) || 0,
        totalAnnouncements: (await prisma.announcement.count({ where: startDate ? { date: { gte: startDate, lte: activityEndDate } } : undefined })) || 0,
        totalForms: (await prisma.form.count({ where: startDate ? { createdAt: { gte: startDate, lte: activityEndDate } } : undefined })) || 0,
        usersByRole: usersByRole.map(item => ({ role: item.role, count: item._count.role })),
        coursesByStatus: (await prisma.course.groupBy({ by: ['status'], _count: { status: true }, where: startDate ? { createdAt: { gte: startDate, lte: activityEndDate } } : undefined })).map(item => ({ status: item.status, count: item._count.status })),
        recentLogins, newEnrollmentsLast7Days, userRegistrationTrend,
        averageCompletionRate,
        topCoursesByEnrollment, topCoursesByCompletion, lowestCoursesByCompletion,
        topStudentsByEnrollment, topStudentsByCompletion, topInstructorsByCourses,
        interactiveEventsToday,
    };
    
    return { adminStats, recentAnnouncements, securityLogs };
}


async function getSharedDashboardData(session: PrismaUser) {
    const today = new Date();
    const rangeStart = startOfWeek(startOfMonth(today));
    const rangeEnd = endOfWeek(endOfMonth(addMonths(today, 1)));
    
    let eventWhereClause: any = {};
    if (session.role !== 'ADMINISTRATOR') {
        eventWhereClause.OR = [
            { audienceType: 'ALL' },
            { audienceType: session.role as UserRole },
            { attendees: { some: { id: session.id } } },
        ];
    }
    const baseEvents = await safeQuery(prisma.calendarEvent.findMany({ where: eventWhereClause }), [], 'baseEvents');
    const allCalendarEvents = expandRecurringEvents(baseEvents, rangeStart, rangeEnd);
    
    const upcomingEvents = allCalendarEvents
        .filter(event => new Date(event.start) >= today)
        .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 3);
        
    let announcementWhereClause: any = {};
    if (session.role !== 'ADMINISTRATOR') {
        announcementWhereClause.OR = [
            { audience: 'ALL' },
            { audience: session.role },
        ];
    }
    const recentAnnouncements = await safeQuery(prisma.announcement.findMany({
        where: announcementWhereClause,
        take: 3,
        orderBy: [{ isPinned: 'desc' }, { date: 'desc' }],
        include: {
            author: { select: { id: true, name: true, avatar: true, role: true } },
        }
    }), [], 'recentAnnouncements');

    return { allCalendarEvents, upcomingEvents, recentAnnouncements };
}


async function getStudentDashboardData(session: PrismaUser, sharedData: any) {
    const [enrolledData] = await Promise.all([
        safeQuery(prisma.enrollment.findMany({
            where: { userId: session.id },
            include: { course: { include: { instructor: { select: { name: true, id: true, avatar: true } }, _count: { select: { modules: true } }, prerequisite: true } }, progress: true },
            orderBy: { progress: { lastActivity: 'desc' } },
            take: 4,
        }), [], 'enrolledData'),
    ]);

    const mappedCourses: EnrolledCourse[] = enrolledData.map(item => ({
        ...mapApiCourseToAppCourse(item.course as any),
        enrollmentId: item.id,
        isEnrolled: true,
        progressPercentage: item.progress?.progressPercentage || 0,
    }));

    return {
        ...sharedData,
        myDashboardCourses: mappedCourses,
    };
}


async function getInstructorDashboardData(session: PrismaUser, sharedData: any) {
    const [totalTaughtCourses, totalStudents] = await Promise.all([
        safeQuery(prisma.course.count({ where: { instructorId: session.id } }), 0, 'totalTaughtCourses'),
        safeQuery(prisma.enrollment.count({
            where: { course: { instructorId: session.id } },
        }), 0, 'totalStudents'),
    ]);

    return {
        ...sharedData,
        instructorStats: { taught: totalTaughtCourses, students: totalStudents },
    };
}


export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const startDate = startDateParam ? startOfDay(new Date(startDateParam)) : undefined;
    const endDate = endDateParam ? endOfDay(new Date(endDateParam)) : undefined;

    try {
        let data: any = {};
        const sharedData = await getSharedDashboardData(session);
        
        switch(session.role) {
            case 'ADMINISTRATOR':
                data = await getAdminDashboardData(session, startDate, endDate);
                break;
            case 'INSTRUCTOR':
                data = await getInstructorDashboardData(session, sharedData);
                break;
            case 'STUDENT':
                data = await getStudentDashboardData(session, sharedData);
                break;
            default:
                return NextResponse.json({ message: 'Rol de usuario no reconocido' }, { status: 400 });
        }
        return NextResponse.json({ ...data, ...sharedData });

    } catch (error) {
        console.error('[DASHBOARD_DATA_API_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los datos del panel principal' }, { status: 500 });
    }
}
