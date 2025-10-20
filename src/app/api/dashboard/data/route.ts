// src/app/api/dashboard/data/route.ts
import prisma from '@/lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus, AdminDashboardStats, EnrolledCourse, Course, Announcement } from '@/types';
import type { User as PrismaUser, Course as PrismaCourse } from '@prisma/client';
import { subDays, startOfDay, endOfDay, isValid, format } from 'date-fns';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';
import { expandRecurringEvents } from '@/lib/calendar-utils';
import { parseUserAgent } from '@/lib/security-log-utils';

export const dynamic = 'force-dynamic';

async function getAdminDashboardData(startDate?: Date, endDate?: Date, userId?: string) {
    // --- Safe Data Fetching with Promise.allSettled ---
    const settledPromises = await Promise.allSettled([
        prisma.user.count({ where: startDate ? { registeredDate: { gte: startDate, lte: endDate } } : undefined }), // 0
        prisma.course.count({ where: startDate ? { createdAt: { gte: startDate, lte: endDate } } : undefined }), // 1
        prisma.course.count({ where: { status: 'PUBLISHED', ...(startDate && { createdAt: { gte: startDate, lte: endDate } }) } }), // 2
        prisma.enrollment.count({ where: startDate ? { enrolledAt: { gte: startDate, lte: endDate } } : undefined }), // 3
        prisma.enterpriseResource.count({ where: startDate ? { uploadDate: { gte: startDate, lte: endDate } } : undefined }), // 4
        prisma.announcement.count({ where: startDate ? { date: { gte: startDate, lte: endDate } } : undefined }), // 5
        prisma.form.count({ where: startDate ? { createdAt: { gte: startDate, lte: endDate } } : undefined }), // 6
        prisma.user.groupBy({ by: ['role'], _count: { role: true }, where: startDate ? { registeredDate: { gte: startDate, lte: endDate } } : undefined }), // 7
        prisma.course.groupBy({ by: ['status'], _count: { status: true }, where: startDate ? { createdAt: { gte: startDate, lte: endDate } } : undefined }), // 8
        prisma.course.findMany({ where: { status: 'PUBLISHED' }, include: { _count: { select: { enrollments: true } }, enrollments: { select: { progress: { select: { progressPercentage: true } } } } } }), // 9
        prisma.user.findMany({ where: { role: 'INSTRUCTOR' }, include: { _count: { select: { courses: true } } } }), // 10
        prisma.user.findMany({ where: { role: 'STUDENT' }, include: { _count: { select: { enrollments: true, courseProgress: { where: { progressPercentage: 100 } } } } } }), // 11
        prisma.announcement.findMany({ take: 2, orderBy: { date: 'desc' }, include: { author: { select: { id: true, name: true, avatar: true, role: true } }, attachments: true, reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { reads: true, reactions: true } } } }), // 12
        prisma.calendarEvent.findMany({ where: { isInteractive: true } }), // 13
        prisma.eventParticipation.findMany({ where: { userId, occurrenceDate: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) } } }) // 14
    ]);

    // --- Process results safely ---
    const getResult = <T>(index: number, fallback: T): T => {
        const result = settledPromises[index];
        if (result.status === 'fulfilled') return result.value as T;
        console.error(`[Dashboard Data] Promise at index ${index} rejected:`, (result as PromiseRejectedResult).reason);
        return fallback;
    };
    
    const totalUsers = getResult<number>(0, 0);
    const totalCourses = getResult<number>(1, 0);
    const totalPublishedCourses = getResult<number>(2, 0);
    const totalEnrollments = getResult<number>(3, 0);
    const totalResources = getResult<number>(4, 0);
    const totalAnnouncements = getResult<number>(5, 0);
    const totalForms = getResult<number>(6, 0);
    const usersByRole = getResult<any[]>(7, []);
    const coursesByStatus = getResult<any[]>(8, []);
    const coursesWithProgress = getResult<any[]>(9, []);
    const instructorsWithCourseCounts = getResult<any[]>(10, []);
    const studentsWithData = getResult<any[]>(11, []);
    const recentAnnouncements = getResult<Announcement[]>(12, []);
    const baseInteractiveEvents = getResult<any[]>(13, []);
    const userParticipationsToday = getResult<any[]>(14, []);
    
    const activityEndDate = endDate || new Date();
    const activityStartDate = startDate || subDays(activityEndDate, 29);

    const [newCoursesTrend, newEnrollmentsTrend, newUsersTrend] = await Promise.all([
        prisma.course.groupBy({ by: ['createdAt'], _count: { _all: true }, where: { createdAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { createdAt: 'asc' } }).catch(() => []),
        prisma.enrollment.groupBy({ by: ['enrolledAt'], _count: { _all: true }, where: { enrolledAt: { gte: activityStartDate, lte: activityEndDate } }, orderBy: { enrolledAt: 'asc' } }).catch(() => []),
        prisma.user.groupBy({ by: ['registeredDate'], _count: { _all: true }, where: { registeredDate: { gte: activityStartDate, lte: activityEndDate } } }),
    ]);

    const activityMap = new Map<string, { newCourses: number, newEnrollments: number, newUsers: number }>();
    for (let d = new Date(activityStartDate); d <= activityEndDate; d.setDate(d.getDate() + 1)) {
        activityMap.set(format(d, 'yyyy-MM-dd'), { newCourses: 0, newEnrollments: 0, newUsers: 0 });
    }

    if (Array.isArray(newCoursesTrend)) newCoursesTrend.forEach(item => { if (item.createdAt && isValid(new Date(item.createdAt))) { const date = format(new Date(item.createdAt), 'yyyy-MM-dd'); if (activityMap.has(date)) activityMap.get(date)!.newCourses += item._count._all; }});
    if (Array.isArray(newEnrollmentsTrend)) newEnrollmentsTrend.forEach(item => { if (item.enrolledAt && isValid(new Date(item.enrolledAt))) { const date = format(new Date(item.enrolledAt), 'yyyy-MM-dd'); if (activityMap.has(date)) activityMap.get(date)!.newEnrollments += item._count._all; }});
    if (Array.isArray(newUsersTrend)) newUsersTrend.forEach(item => { if (item.registeredDate && isValid(new Date(item.registeredDate))) { const date = format(new Date(item.registeredDate), 'yyyy-MM-dd'); if (activityMap.has(date)) activityMap.get(date)!.newUsers += item._count._all; }});
    
    const userRegistrationTrend = Array.from(activityMap.entries()).map(([date, counts]) => ({ date, ...counts }));

    const participationsSet = new Set(userParticipationsToday.map(p => `${p.eventId}-${p.occurrenceDate.toISOString().split('T')[0]}`));

    const expandedInteractiveEventsToday = Array.isArray(baseInteractiveEvents) ? expandRecurringEvents(baseInteractiveEvents, startOfDay(new Date()), endOfDay(new Date())) : [];
    
    const interactiveEventsToday = expandedInteractiveEventsToday.map(event => ({
        ...event,
        hasParticipated: participationsSet.has(`${event.parentId || event.id}-${new Date(event.start).toISOString().split('T')[0]}`)
    }));
    
    const completionRates = coursesWithProgress.map(c => { const validProgresses = c.enrollments.map((e:any) => e.progress?.progressPercentage).filter((p:any) => p !== null) as number[]; return validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0; }).filter(rate => rate > 0);
    const averageCompletionRate = completionRates.length > 0 ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length : 0;
    const topCoursesByEnrollment = [...coursesWithProgress].sort((a, b) => b._count.enrollments - a._count.enrollments).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));
    const courseCompletionData = coursesWithProgress.map(c => { const validProgresses = c.enrollments.map((e:any) => e.progress?.progressPercentage).filter((p:any) => p !== null) as number[]; const avg = validProgresses.length > 0 ? validProgresses.reduce((a, b) => a + b, 0) / validProgresses.length : 0; return { id: c.id, title: c.title, imageUrl: c.imageUrl, value: avg }; });
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
        userRegistrationTrend, averageCompletionRate,
        topCoursesByEnrollment, topCoursesByCompletion, lowestCoursesByCompletion,
        topStudentsByEnrollment, topStudentsByCompletion, topInstructorsByCourses,
        interactiveEventsToday,
    };

    return { adminStats: stats, recentAnnouncements };
}

async function getInstructorDashboardData(session: PrismaUser) {
    // ... (código sin cambios)
    const [taughtCoursesResponse, announcementsData, totalStudents] = await Promise.all([
        prisma.course.findMany({
            where: { instructorId: session.id },
            include: { _count: { select: { modules: true } } },
            orderBy: { createdAt: 'desc' },
            take: 2,
        }).catch(() => []),
        prisma.announcement.findMany({
            take: 1, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true, role: true } },
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }).catch(() => []),
        prisma.enrollment.count({
            where: {
                course: {
                    instructorId: session.id,
                },
            },
        }).catch(() => 0),
    ]);
    const totalTaughtCourses = await prisma.course.count({ where: { instructorId: session.id } }).catch(() => 0);
    
    return {
        instructorStats: { taught: totalTaughtCourses, students: totalStudents },
        taughtCourses: taughtCoursesResponse.map(c => mapApiCourseToAppCourse(c as any)),
        recentAnnouncements: announcementsData,
    };
}

async function getStudentDashboardData(session: PrismaUser) {
    // ... (código sin cambios)
     const [enrolledData, announcementsData, assignedCoursesData] = await Promise.all([
        prisma.enrollment.findMany({
            where: { userId: session.id },
            include: { course: { include: { instructor: { select: { name: true, id: true, avatar: true } }, _count: { select: { modules: true } } } }, progress: true },
            orderBy: { enrolledAt: 'desc' },
            take: 2,
        }).catch(() => []),
        prisma.announcement.findMany({
            take: 2, orderBy: { date: 'desc' },
            include: { 
                author: { select: { id: true, name: true, avatar: true, role: true } },
                attachments: true, 
                reactions: { select: { userId: true, reaction: true, user: { select: { id: true, name: true, avatar: true } } } }, 
                _count: { select: { reads: true, reactions: true } },
            },
        }).catch(() => []),
        prisma.courseAssignment.findMany({
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
                    }
                }
            },
            orderBy: { assignedAt: 'desc' },
            take: 2,
        }).catch(() => []),
    ]);

    const totalEnrollments = await prisma.enrollment.count({ where: { userId: session.id } }).catch(() => 0);
    const completedCount = await prisma.courseProgress.count({ where: { userId: session.id, progressPercentage: 100 } }).catch(() => 0);

    const mappedCourses: EnrolledCourse[] = enrolledData.map(item => ({
        id: item.course.id, title: item.course.title, description: item.course.description, 
        instructor: { id: item.course.instructor?.id || '', name: item.course.instructor?.name || 'N/A', avatar: item.course.instructor?.avatar || null },
        imageUrl: item.course.imageUrl, modulesCount: item.course._count.modules || 0,
        enrolledAt: item.enrolledAt.toISOString(), isEnrolled: true, instructorId: item.course.instructorId, status: 'PUBLISHED',
        progressPercentage: item.progress?.progressPercentage || 0,
        modules: [],
        category: item.course.category || undefined,
        publicationDate: item.course.publicationDate,
        isMandatory: item.course.isMandatory
    }));

    const mappedAssignedCourses: Course[] = assignedCoursesData.map(assignment => mapApiCourseToAppCourse(assignment.course as any));

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
