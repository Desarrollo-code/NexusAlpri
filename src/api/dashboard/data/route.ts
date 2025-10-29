// src/app/api/dashboard/data/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus, AdminDashboardStats, EnrolledCourse, Course as AppCourseType, Announcement as AnnouncementType, CalendarEvent } from '@/types';
import type { User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { subDays, startOfDay, endOfDay, isValid, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths } from 'date-fns';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { expandRecurringEvents } from '@/lib/calendar-utils';

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

    const dateFilterRegistered = startDate ? { registeredDate: { gte: startDate, lte: activityEndDate } } : {};
    const dateFilterEnrolled = startDate ? { enrolledAt: { gte: startDate, lte: activityEndDate } } : {};
    const dateFilterCourse = startDate ? { createdAt: { gte: startDate, lte: activityEndDate } } : {};

    // --- Transaction to fetch most stats in one go ---
    const [
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        progressAggregates
    ] = await prisma.$transaction([
        prisma.user.count({ where: dateFilterRegistered }),
        prisma.course.count({ where: dateFilterCourse }),
        prisma.course.count({ where: { status: 'PUBLISHED', ...dateFilterCourse } }),
        prisma.enrollment.count({ where: dateFilterEnrolled }),
        prisma.courseProgress.aggregate({
            _sum: { progressPercentage: true },
            _count: { progressPercentage: true },
            where: {
                progressPercentage: { not: null }
            }
        }),
    ]);
    
    const averageCompletionRate = progressAggregates._count.progressPercentage && progressAggregates._count.progressPercentage > 0
        ? (progressAggregates._sum.progressPercentage! / progressAggregates._count.progressPercentage)
        : 0;

    // --- Separate queries for trend data ---
    const trendStartDate = subDays(new Date(), 14); // Last 15 days
    const [
        newUsersTrendRaw, newCoursesTrendRaw, newEnrollmentsTrendRaw,
    ] = await Promise.all([
        safeQuery(prisma.user.groupBy({ by: ['registeredDate'], _count: { _all: true }, where: { registeredDate: { gte: trendStartDate } }, orderBy: { registeredDate: 'asc' } }), [], 'newUsersTrend'),
        safeQuery(prisma.course.groupBy({ by: ['createdAt'], _count: { _all: true }, where: { createdAt: { gte: trendStartDate } }, orderBy: { createdAt: 'asc' } }), [], 'newCoursesTrend'),
        safeQuery(prisma.enrollment.groupBy({ by: ['enrolledAt'], _count: { _all: true }, where: { enrolledAt: { gte: trendStartDate } }, orderBy: { enrolledAt: 'asc' } }), [], 'newEnrollmentsTrend'),
    ]);
    
    const trendMap = new Map<string, { date: string, users: number, courses: number, enrollments: number }>();
    for (let d = new Date(trendStartDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const dateKey = format(d, 'yyyy-MM-dd');
        trendMap.set(dateKey, { date: dateKey, users: 0, courses: 0, enrollments: 0 });
    }

    newUsersTrendRaw.forEach(item => { if(item.registeredDate){ const date = format(item.registeredDate, 'yyyy-MM-dd'); if (trendMap.has(date)) trendMap.get(date)!.users += item._count._all; }});
    newCoursesTrendRaw.forEach(item => { const date = format(item.createdAt, 'yyyy-MM-dd'); if (trendMap.has(date)) trendMap.get(date)!.courses += item._count._all; });
    newEnrollmentsTrendRaw.forEach(item => { const date = format(item.enrolledAt, 'yyyy-MM-dd'); if (trendMap.has(date)) trendMap.get(date)!.enrollments += item._count._all; });
    
    const fullTrendData = Array.from(trendMap.values());

    const adminStats: AdminDashboardStats = {
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        averageCompletionRate,
        userRegistrationTrend: fullTrendData.map(d => ({ date: d.date, count: d.users })),
        contentActivityTrend: fullTrendData.map(d => ({ date: d.date, newCourses: d.courses, newEnrollments: d.enrollments })),
        enrollmentTrend: fullTrendData.map(d => ({ date: d.date, count: d.enrollments }))
    };
    
    return { adminStats };
}


async function getSharedDashboardData(session: PrismaUser) {
    const today = new Date();
    const rangeStart = startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
    const rangeEnd = endOfWeek(endOfMonth(addMonths(today, 1)), { weekStartsOn: 1 });
    
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


async function getStudentDashboardData(session: PrismaUser) {
    const [enrolledData, assignedCoursesData, studentStats, baseInteractiveEvents] = await Promise.all([
        safeQuery(prisma.enrollment.findMany({
            where: { userId: session.id },
            include: { course: { include: { instructor: { select: { name: true, id: true, avatar: true } }, _count: { select: { modules: true } }, prerequisite: true } }, progress: true },
            orderBy: { progress: { lastActivity: 'desc' } },
            take: 4,
        }), [], 'enrolledData'),
        safeQuery(prisma.courseAssignment.findMany({
            where: { userId: session.id, course: { enrollments: { none: { userId: session.id } } } },
            include: { course: { include: { instructor: { select: { id: true, name: true, avatar: true } }, _count: { select: { modules: true } } } } },
            orderBy: { assignedAt: 'desc' }, take: 2,
        }), [], 'assignedCoursesData'),
         prisma.$transaction([
            prisma.enrollment.count({ where: { userId: session.id } }),
            prisma.courseProgress.count({ where: { userId: session.id, progressPercentage: 100 } })
        ]),
        safeQuery(prisma.calendarEvent.findMany({ where: { isInteractive: true } }), [], 'baseInteractiveEvents')
    ]);
    
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const expandedInteractiveEventsToday = expandRecurringEvents(baseInteractiveEvents, todayStart, todayEnd);
    const userParticipationsToday = await safeQuery(prisma.eventParticipation.findMany({ where: { userId: session.id, occurrenceDate: { gte: todayStart, lte: todayEnd } } }), [], 'userParticipations');
    const participationsSet = new Set(userParticipationsToday.map(p => `${p.eventId}-${p.occurrenceDate.toISOString().split('T')[0]}`));
    const interactiveEventsToday = expandedInteractiveEventsToday.map(event => ({ ...event, hasParticipated: participationsSet.has(`${event.parentId || event.id}-${new Date(event.start).toISOString().split('T')[0]}`) }));

    const [totalEnrollments, completedCount] = studentStats;

    const mappedCourses: EnrolledCourse[] = enrolledData.map(item => ({
        ...mapApiCourseToAppCourse(item.course as any),
        enrollmentId: item.id,
        isEnrolled: true,
        progressPercentage: item.progress?.progressPercentage || 0,
    }));
    
    const mappedAssignedCourses: AppCourseType[] = assignedCoursesData.map(assignment => mapApiCourseToAppCourse(assignment.course as any));

    return {
        studentStats: { enrolled: totalEnrollments, completed: completedCount, interactiveEventsToday },
        myDashboardCourses: mappedCourses,
        assignedCourses: mappedAssignedCourses,
    };
}


async function getInstructorDashboardData(session: PrismaUser) {
    const [totalTaughtCourses, totalStudents] = await Promise.all([
        safeQuery(prisma.course.count({ where: { instructorId: session.id } }), 0, 'totalTaughtCourses'),
        safeQuery(prisma.enrollment.count({
            where: { course: { instructorId: session.id } },
        }), 0, 'totalStudents'),
    ]);
    
    const taughtCourses = await safeQuery(prisma.course.findMany({
        where: { instructorId: session.id },
        include: { 
            modules: {
                include: {
                    _count: { select: { lessons: true }}
                }
            },
            enrollments: { 
                select: { progress: { select: { progressPercentage: true } } } 
            } 
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Fetch more to display more cards
    }), [], 'taughtCourses');

     const processedCourses = taughtCourses.map(course => {
        const enrollmentsWithProgress = course.enrollments.filter(e => e.progress?.progressPercentage !== null);
        const avgCompletion = enrollmentsWithProgress.length > 0 
            ? enrollmentsWithProgress.reduce((sum, e) => sum + e.progress!.progressPercentage!, 0) / enrollmentsWithProgress.length
            : 0;
        
        return {
            ...mapApiCourseToAppCourse(course),
            averageCompletion: avgCompletion,
            lessonsCount: course.modules.reduce((sum, mod) => sum + mod._count.lessons, 0)
        }
    });

    return {
        instructorStats: { taught: totalTaughtCourses, students: totalStudents },
        taughtCourses: processedCourses,
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
                const adminData = await getAdminDashboardData(session, startDate, endDate);
                const securityLogs = await safeQuery(prisma.securityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }), [], 'securityLogs');
                data = { ...adminData, securityLogs };
                break;
            case 'INSTRUCTOR':
                data = await getInstructorDashboardData(session);
                break;
            case 'STUDENT':
                data = await getStudentDashboardData(session);
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
