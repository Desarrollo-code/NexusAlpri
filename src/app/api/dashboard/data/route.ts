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

async function getSharedDashboardData(session: PrismaUser) {
    const today = new Date();
    const rangeStart = startOfWeek(startOfMonth(today));
    const rangeEnd = endOfWeek(endOfMonth(addMonths(today, 1)));
    
    // Base query for events
    let eventWhereClause: any = {};
    if (session.role !== 'ADMINISTRATOR') {
        eventWhereClause.OR = [
            { audienceType: 'ALL' },
            { audienceType: session.role as UserRole },
            { attendees: { some: { id: session.id } } },
        ];
    }
    const baseEvents = await prisma.calendarEvent.findMany({ where: eventWhereClause });
    const allCalendarEvents = expandRecurringEvents(baseEvents, rangeStart, rangeEnd);
    
    const upcomingEvents = allCalendarEvents
        .filter(event => new Date(event.start) >= today)
        .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 3);
        
    // Announcements
    let announcementWhereClause: any = {};
    if (session.role !== 'ADMINISTRATOR') {
        announcementWhereClause.OR = [
            { audience: 'ALL' },
            { audience: session.role },
        ];
    }
    const recentAnnouncements = await prisma.announcement.findMany({
        where: announcementWhereClause,
        take: 3,
        orderBy: [{ isPinned: 'desc' }, { date: 'desc' }],
        include: {
            author: { select: { id: true, name: true, avatar: true, role: true } },
        }
    });

    return { allCalendarEvents, upcomingEvents, recentAnnouncements };
}


async function getStudentDashboardData(session: PrismaUser, sharedData: any) {
    const [enrolledData] = await Promise.all([
        prisma.enrollment.findMany({
            where: { userId: session.id },
            include: { course: { include: { instructor: { select: { name: true, id: true, avatar: true } }, _count: { select: { modules: true } }, prerequisite: true } }, progress: true },
            orderBy: { progress: { lastActivity: 'desc' } }, // Recently accessed
            take: 4,
        }).catch(() => []),
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
        prisma.course.count({ where: { instructorId: session.id } }).catch(() => 0),
        prisma.enrollment.count({
            where: { course: { instructorId: session.id } },
        }).catch(() => 0),
    ]);

    return {
        ...sharedData,
        instructorStats: { taught: totalTaughtCourses, students: totalStudents },
    };
}


async function getAdminDashboardData(session: PrismaUser, sharedData: any) {
     const [totalUsers, totalCourses, totalEnrollments, recentLogins, averageCompletionResult] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.securityLog.count({
            where: {
                event: "SUCCESSFUL_LOGIN",
                createdAt: { gte: subDays(new Date(), 7) }
            },
            distinct: ['userId']
        }),
        prisma.courseProgress.aggregate({
            _avg: {
                progressPercentage: true,
            },
            where: {
                NOT: {
                    progressPercentage: null
                }
            },
        }),
    ]);
    
    return {
        ...sharedData,
        adminStats: {
            totalUsers,
            totalCourses,
            totalEnrollments,
            recentLogins,
            averageCompletionRate: averageCompletionResult._avg.progressPercentage
        }
    };
}


export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        let data: any = {};
        const sharedData = await getSharedDashboardData(session);
        
        switch(session.role) {
            case 'ADMINISTRATOR':
                data = await getAdminDashboardData(session, sharedData);
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
        return NextResponse.json(data);

    } catch (error) {
        console.error('[DASHBOARD_DATA_API_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los datos del panel principal' }, { status: 500 });
    }
}
