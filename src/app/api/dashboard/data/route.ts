// src/app/api/dashboard/data/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus, AdminDashboardStats, EnrolledCourse, Course, Announcement } from '@/types';
import type { User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';
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

async function getAdminDashboardData(startDate?: Date, endDate?: Date, userId?: string) {
    const dateFilter = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };
    const enrollmentDateFilter = {
        enrolledAt: {
            gte: startDate,
            lte: endDate
        }
    };
    
    const [
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        totalResources, totalAnnouncements, totalForms, usersByRole, coursesByStatus,
        recentLogins, newEnrollmentsLast7Days
    ] = await Promise.all([
        safeQuery(prisma.user.count({ where: startDate ? dateFilter : undefined }), 0, 'totalUsers'),
        safeQuery(prisma.course.count({ where: startDate ? dateFilter : undefined }), 0, 'totalCourses'),
        safeQuery(prisma.course.count({ where: { status: 'PUBLISHED', ...(startDate && { createdAt: { gte: startDate, lte: endDate } }) } }), 0, 'totalPublishedCourses'),
        safeQuery(prisma.enrollment.count({ where: startDate ? enrollmentDateFilter : undefined }), 0, 'totalEnrollments'),
        safeQuery(prisma.enterpriseResource.count({ where: startDate ? dateFilter : undefined }), 0, 'totalResources'),
        safeQuery(prisma.announcement.count({ where: startDate ? { date: { gte: startDate, lte: endDate } } : undefined }), 0, 'totalAnnouncements'),
        safeQuery(prisma.form.count({ where: startDate ? dateFilter : undefined }), 0, 'totalForms'),
        safeQuery(prisma.user.groupBy({ by: ['role'], _count: { role: true }, where: startDate ? dateFilter : undefined }), [], 'usersByRole'),
        safeQuery(prisma.course.groupBy({ by: ['status'], _count: { status: true }, where: startDate ? dateFilter : undefined }), [], 'coursesByStatus'),
        safeQuery(prisma.securityLog.count({ where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: subDays(new Date(), 7) } }, distinct: ['userId'] }), 0, 'recentLogins'),
        safeQuery(prisma.enrollment.count({ where: { enrolledAt: { gte: subDays(new Date(), 7) } } }), 0, 'newEnrollmentsLast7Days'),
    ]);

    const activityEndDate = endDate || new Date();
    const activityStartDate = startDate || subDays(activityEndDate, 29);

    const [newCoursesTrend, newEnrollmentsTrend, newUsersTrend] = await Promise.all([
        safeQuery(prisma.course.groupBy({ by: ['createdAt'], _count: { _all: true }, where: { createdAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { createdAt: 'asc' } }), [], 'newCoursesTrend'),
        safeQuery(prisma.enrollment.groupBy({ by: ['enrolledAt'], _count: { _all: true }, where: { enrolledAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { enrolledAt: 'asc' } }), [], 'newEnrollmentsTrend'),
        safeQuery(prisma.user.groupBy({ by: ['registeredDate'], _count: { _all: true }, where: { registeredDate: { gte: activityStartDate, lte: activityEndDate } } }), [], 'newUsersTrend'),
    ]);

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
    
    const [recentAnnouncements, securityLogs] = await Promise.all([
        safeQuery(prisma.announcement.findMany({ take: 1, orderBy: { date: 'desc' }, include: { author: { select: { id: true, name: true, avatar: true, role: true } }, attachments: true, reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { reads: true, reactions: true } } } }), [], 'recentAnnouncements'),
        safeQuery(prisma.securityLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }), [], 'securityLogs'),
    ]);
    
    // --- Interactive Events ---
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const baseInteractiveEvents = await safeQuery(prisma.calendarEvent.findMany({ where: { isInteractive: true } }), [], 'interactiveEvents');
    const expandedInteractiveEventsToday = expandRecurringEvents(baseInteractiveEvents, todayStart, todayEnd);
    const userParticipationsToday = await safeQuery(prisma.eventParticipation.findMany({
        where: { userId, occurrenceDate: { gte: todayStart, lte: todayEnd } }
    }), [], 'userParticipations');
    
    const participationsSet = new Set(userParticipationsToday.map(p => `${p.eventId}-${p.occurrenceDate.toISOString().split('T')[0]}`));

    const interactiveEventsToday = expandedInteractiveEventsToday.map(event => ({
        ...event,
        hasParticipated: participationsSet.has(`${event.parentId || event.id}-${new Date(event.start).toISOString().split('T')[0]}`)
    }));
    
    const coursesWithProgress = await safeQuery(prisma.course.findMany({ where: { status: 'PUBLISHED' }, include: { _count: { select: { enrollments: true } }, enrollments: { select: { progress: { select: { progressPercentage: true } } } } } }), [], 'coursesWithProgress');
    const instructorsWithCourseCounts = await safeQuery(prisma.user.findMany({ where: { role: 'INSTRUCTOR' }, include: { _count: { select: { courses: true } } } }), [], 'instructorsWithCourseCounts');
    const studentsWithData = await safeQuery(prisma.user.findMany({ where: { role: 'STUDENT' }, include: { _count: { select: { enrollments: true, courseProgress: { where: { progressPercentage: 100 } } } } } }), [], 'studentsWithData');
    
    const completionRates = coursesWithProgress.map(c => { const validProgresses = c.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null) as number[]; return validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0; }).filter(rate => rate > 0);
    const averageCompletionRate = completionRates.length > 0 ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length : 0;
    const topCoursesByEnrollment = [...coursesWithProgress].sort((a, b) => b._count.enrollments - a._count.enrollments).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));
    const courseCompletionData = coursesWithProgress.map(c => { const validProgresses = c.enrollments.map(e => e.progress?.progressPercentage).filter(p => p !== null) as number[]; const avg = validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0; return { id: c.id, title: c.title, imageUrl: c.imageUrl, value: avg }; });
    const topCoursesByCompletion = [...courseCompletionData].filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
    const lowestCoursesByCompletion = [...courseCompletionData].filter(c => c.value > 0).sort((a, b) => a.value - b.value).slice(0, 5);
    const topStudentsByEnrollment = [...studentsWithData].sort((a,b) => b._count.enrollments - a._count.enrollments).slice(0,5).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments }));
    const topStudentsByCompletion = [...studentsWithData].sort((a,b) => b._count.courseProgress - a._count.courseProgress).slice(0,5).map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.courseProgress }));
    const topInstructorsByCourses = [...instructorsWithCourseCounts].sort((a, b) => b._count.courses - a._count.courses).slice(0, 5).map(i => ({ id: i.id, name: i.name, avatar: i.avatar, value: i._count.courses }));

    const stats: AdminDashboardStats = {
        totalUsers, totalCourses, totalPublishedCourses, totalEnrollments,
        totalResources, totalAnnouncements, totalForms,
        usersByRole: usersByRole.map(item => ({ role: item.role, count: item._count.role })),
        coursesByStatus: coursesByStatus.map(item => ({ status: item.status, count: item._count.status })),
        recentLogins, newEnrollmentsLast7Days, userRegistrationTrend,
        averageCompletionRate,
        topCoursesByEnrollment, topCoursesByCompletion, lowestCoursesByCompletion,
        topStudentsByEnrollment, topStudentsByCompletion, topInstructorsByCourses,
        interactiveEventsToday,
    };

    return { adminStats: stats, recentAnnouncements, securityLogs };
}


async function getInstructorDashboardData(session: PrismaUser) {
    const [taughtCoursesResponse, announcementsData, instructorStats] = await Promise.all([
        safeQuery(prisma.course.findMany({
            where: { instructorId: session.id },
            include: { _count: { select: { modules: true } } },
            orderBy: { createdAt: 'desc' },
            take: 2,
        }), [], 'taughtCourses'),
        safeQuery(prisma.announcement.findMany({
            take: 1, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true, role: true } },
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }), [], 'announcementsData'),
        safeQuery(prisma.course.aggregate({
            where: { instructorId: session.id },
            _count: { id: true },
            _sum: { _count: { select: { enrollments: true } } } // This is an approximation
        }), { _count: { id: 0 }, _sum: { _count: { enrollments: 0 }}}, 'instructorStats'),
        prisma.enrollment.count({ where: { course: { instructorId: session.id } } })
    ]);
    
    const [totalTaughtCourses, totalStudents] = await Promise.all([
        prisma.course.count({ where: { instructorId: session.id } }),
        prisma.enrollment.count({ where: { course: { instructorId: session.id } } })
    ]);
    
    return {
        instructorStats: { taught: totalTaughtCourses, students: totalStudents },
        taughtCourses: taughtCoursesResponse.map(c => mapApiCourseToAppCourse(c as any)),
        recentAnnouncements: announcementsData,
    };
}

async function getStudentDashboardData(session: PrismaUser) {
    const [enrolledData, announcementsData, assignedCoursesData] = await Promise.all([
        safeQuery(prisma.enrollment.findMany({
            where: { userId: session.id },
            include: { course: { include: { instructor: { select: { name: true, id: true, avatar: true } }, _count: { select: { modules: true } }, prerequisite: { select: {id: true, title: true} } } }, progress: true },
            orderBy: { enrolledAt: 'desc' },
            take: 2,
        }), [], 'enrolledData'),
        safeQuery(prisma.announcement.findMany({
            take: 1, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true, role: true } },
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }), [], 'announcementsData'),
        safeQuery(prisma.courseAssignment.findMany({
            where: { 
                userId: session.id,
                course: {
                    enrollments: {
                        none: {
                            userId: session.id
                        }
                    }
                }
            },
            include: {
                course: {
                    include: {
                        instructor: { select: { id: true, name: true, avatar: true } },
                        _count: { select: { modules: true } },
                        prerequisite: { select: {id: true, title: true} }
                    }
                }
            },
            orderBy: { assignedAt: 'desc' },
            take: 2,
        }), [], 'assignedCoursesData'),
    ]);

    const totalEnrollments = await safeQuery(prisma.enrollment.count({ where: { userId: session.id } }), 0, 'totalEnrollments');
    const completedCount = await safeQuery(prisma.courseProgress.count({ where: { userId: session.id, progressPercentage: 100 } }), 0, 'completedCount');

    const mappedCourses: EnrolledCourse[] = enrolledData.map(item => ({
        id: item.course.id, title: item.course.title, description: item.course.description, 
        instructor: { id: item.course.instructor?.id || '', name: item.course.instructor?.name || 'N/A', avatar: item.course.instructor?.avatar || null },
        imageUrl: item.course.imageUrl, modulesCount: item.course._count.modules || 0,
        enrolledAt: item.enrolledAt.toISOString(), isEnrolled: true, instructorId: item.course.instructorId, status: 'PUBLISHED',
        progressPercentage: item.progress?.progressPercentage || 0,
        modules: [],
        category: item.course.category || undefined,
        publicationDate: item.course.publicationDate,
        isMandatory: item.course.isMandatory,
        prerequisite: item.course.prerequisite,
        enrollmentId: item.id,
    }));

    const mappedAssignedCourses: AppCourseType[] = assignedCoursesData.map(assignment => mapApiCourseToAppCourse(assignment.course as any));

    return {
        studentStats: { enrolled: totalEnrollments, completed: completedCount },
        myDashboardCourses: mappedCourses,
        recentAnnouncements: announcementsData,
        assignedCourses: mappedAssignedCourses,
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
        switch(session.role) {
            case 'ADMINISTRATOR':
                data = await getAdminDashboardData(startDate, endDate, session.id);
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
        return NextResponse.json(data);

    } catch (error) {
        console.error('[DASHBOARD_DATA_API_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los datos del panel principal' }, { status: 500 });
    }
}
