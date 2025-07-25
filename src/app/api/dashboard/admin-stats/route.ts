// src/app/api/dashboard/admin-stats/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
// Asegúrate de que UserRole y CourseStatus estén correctamente importados.
// Podrían venir de '@prisma/client' o de tu archivo de tipos si los has definido manualmente.
import type { UserRole, CourseStatus } from '@prisma/client'; // <-- ASUMO que vienen de @prisma/client, si no, ajusta la ruta.

// Esto ayuda a Next.js a entender que esta ruta siempre debe ser dinámica.
// Resuelve la advertencia de 'cookies() should be awaited'.
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Opcional, pero va de la mano con force-dynamic para asegurar la frescura de los datos.

type CourseInfo = {
    id: string;
    title: string;
    imageUrl: string | null;
    value: number;
}

type UserInfo = {
    id: string;
    name: string | null;
    avatar: string | null;
    value: number;
}

export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
    recentLogins: number; // Active users in last 7 days
    newUsersLast7Days: number;
    userRegistrationTrend: { date: string, count: number }[];
    courseActivity: { date: string, newCourses: number, publishedCourses: number, newEnrollments: number }[];
    averageCompletionRate: number;
    topCoursesByEnrollment: CourseInfo[];
    topCoursesByCompletion: CourseInfo[];
    lowestCoursesByCompletion: CourseInfo[];
    topStudentsByEnrollment: UserInfo[];
    topStudentsByCompletion: UserInfo[];
    topInstructorsByCourses: UserInfo[];
}

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    // ¡IMPORTANTE! Revisa que el 'role' en tu JWT y en tu base de datos sea EXACTAMENTE 'ADMINISTRATOR'.
    // Si en tu DB/JWT es 'ADMIN' o 'admin', esta condición fallará.
    if (!session || session.role !== 'ADMINISTRATOR') {
<<<<<<< HEAD
        console.log(`Intento de acceso no autorizado al dashboard. Usuario: ${session?.name || 'N/A'}, Rol: ${session?.role || 'N/A'}`);
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
=======
        console.warn(`Intento de acceso no autorizado al dashboard. Usuario: ${session?.email || 'N/A'}, Rol: ${session?.role || 'N/A'}`);
        return NextResponse.json({ message: 'No autorizado o no tiene permisos de administrador' }, { status: 403 });
>>>>>>> 213a36c0747a30247f2a5200ddc2c201d82c4a0c
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const sevenDaysAgo = subDays(today, 7);

        const [
            // Corregido: `prisma.user.count()` directamente devuelve el número
            totalUsersResult, // Cambiado el nombre para clarificar que es un resultado directo
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole,
            coursesByStatus,
            recentLoginLogs,
            newUsersLast7Days,
            recentUsersData,
            newCoursesData,
            publishedCoursesData,
            newEnrollmentsData,
            allCourseProgressRaw,
            coursesWithEnrollmentCounts,
            studentsByEnrollmentRaw,
            studentsByCompletionsRaw,
            instructorsByCoursesRaw
        ] = await prisma.$transaction([
            // Corrección: Para obtener el total de usuarios, simplemente usa prisma.user.count()
            prisma.user.count(), // Esto devolverá un número directamente
            prisma.course.count(),
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            prisma.enrollment.count(),
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.securityLog.groupBy({
                by: ['userId'],
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: startOfDay(sevenDaysAgo) } }, // Usar startOfDay para asegurar que abarque todo el día
            }),
            prisma.user.count({ where: { registeredDate: { gte: startOfDay(sevenDaysAgo) } } }), // Usar startOfDay
            prisma.user.findMany({ where: { registeredDate: { gte: startOfDay(sevenDaysAgo) } }, select: { registeredDate: true } }), // Usar startOfDay
            prisma.course.findMany({ where: { createdAt: { gte: startOfDay(thirtyDaysAgo) } }, select: { createdAt: true } }), // Usar startOfDay
            prisma.course.findMany({ where: { publicationDate: { not: null, gte: startOfDay(thirtyDaysAgo) } }, select: { publicationDate: true } }), // Usar startOfDay
            prisma.enrollment.findMany({ where: { enrolledAt: { gte: startOfDay(thirtyDaysAgo) } }, select: { enrolledAt: true } }), // Usar startOfDay
            // Asegúrate de que 'courseId' no sea nulo si lo esperas en el WHERE de findMany
            prisma.courseProgress.findMany({ where: { courseId: { not: null } }, select: { courseId: true, progressPercentage: true, userId: true } }),
            prisma.course.findMany({
                where: { status: 'PUBLISHED' },
                select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } },
            }),
            prisma.user.findMany({
                where: { role: 'STUDENT' }, // Asegúrate que 'STUDENT' es el rol correcto
                select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } },
                orderBy: { enrollments: { _count: 'desc' } },
                take: 5
            }),
            // Asegúrate que userId en _count es correcto, o si quieres contar por cursoId
            prisma.courseProgress.groupBy({
                by: ['userId'],
                where: { progressPercentage: { gte: 100 } }, // courseId no es necesario aquí si agrupas por userId
                _count: { _all: true }, // Contar todas las entradas por userId
                orderBy: { _count: { _all: 'desc' } },
                take: 5
            }),
            prisma.user.findMany({
                where: { role: { in: ['INSTRUCTOR', 'ADMINISTRATOR'] } },
                select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } },
                orderBy: { courses: { _count: 'desc' } },
                take: 5
            }),
        ]);

        // totalUsers ahora es el número directamente, no un objeto.
        const totalUsers = totalUsersResult;

        const dateRange7Days = eachDayOfInterval({ start: startOfDay(sevenDaysAgo), end: startOfDay(today) }); // Rango de fechas hasta hoy (completo)
        const registrationsByDate = new Map<string, number>();
        recentUsersData.forEach(user => {
            if (user.registeredDate) {
                const dateKey = format(startOfDay(new Date(user.registeredDate)), 'yyyy-MM-dd'); // Normalizar a inicio del día
                registrationsByDate.set(dateKey, (registrationsByDate.get(dateKey) || 0) + 1);
            }
        });

        const userRegistrationTrend = dateRange7Days.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            return {
                date: format(date, 'MMM d', { locale: es }),
                count: registrationsByDate.get(dateKey) || 0,
            };
        });

        const dateRange30Days = eachDayOfInterval({ start: startOfDay(thirtyDaysAgo), end: startOfDay(today) }); // Rango de fechas hasta hoy (completo)
        const courseActivityMap = new Map<string, { newCourses: number, publishedCourses: number, newEnrollments: number }>();

        dateRange30Days.forEach(day => {
            courseActivityMap.set(format(day, 'yyyy-MM-dd'), { newCourses: 0, publishedCourses: 0, newEnrollments: 0 });
        });

        newCoursesData.forEach(c => { const key = format(startOfDay(c.createdAt), 'yyyy-MM-dd'); if(courseActivityMap.has(key)) courseActivityMap.get(key)!.newCourses++; });
        publishedCoursesData.forEach(c => { if(c.publicationDate) { const key = format(startOfDay(c.publicationDate), 'yyyy-MM-dd'); if(courseActivityMap.has(key)) courseActivityMap.get(key)!.publishedCourses++; } });
        newEnrollmentsData.forEach(e => { const key = format(startOfDay(e.enrolledAt), 'yyyy-MM-dd'); if(courseActivityMap.has(key)) courseActivityMap.get(key)!.newEnrollments++; });

        const courseActivity = Array.from(courseActivityMap.entries()).map(([date, counts]) => ({
            date: format(new Date(date), 'MMM d', { locale: es }),
            ...counts
        })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Asegurar orden cronológico

        const totalProgressSum = allCourseProgressRaw.reduce((sum, p) => sum + (p.progressPercentage || 0), 0);
        const averageCompletionRate = allCourseProgressRaw.length > 0 ? totalProgressSum / allCourseProgressRaw.length : 0;

        const topCoursesByEnrollment = coursesWithEnrollmentCounts
            .sort((a, b) => b._count.enrollments - a._count.enrollments)
            .slice(0, 5)
            .map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: c._count.enrollments }));

        const completionRatesByCourse = new Map<string, { total: number; count: number }>();
        allCourseProgressRaw.forEach(p => {
            if (p.courseId) {
                if (!completionRatesByCourse.has(p.courseId)) {
                    completionRatesByCourse.set(p.courseId, { total: 0, count: 0 });
                }
                const courseData = completionRatesByCourse.get(p.courseId)!;
                courseData.total += p.progressPercentage || 0;
                courseData.count++;
            }
        });

        const coursesWithAvgRates = coursesWithEnrollmentCounts.map(course => ({
            ...course,
            avgCompletion: completionRatesByCourse.has(course.id)
                ? completionRatesByCourse.get(course.id)!.total / completionRatesByCourse.get(course.id)!.count
                : 0,
        }));

        const topCoursesByCompletion = [...coursesWithAvgRates].sort((a, b) => b.avgCompletion - a.avgCompletion).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: Math.round(c.avgCompletion) }));
        const lowestCoursesByCompletion = [...coursesWithAvgRates].filter(c => c._count.enrollments > 0).sort((a, b) => a.avgCompletion - b.avgCompletion).slice(0, 5).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, value: Math.round(c.avgCompletion) }));

        const topCompleterIds = studentsByCompletionsRaw.map(s => s.userId);
        // Se debe usar findUnique para obtener los detalles de cada usuario si los _count.userId son IDs únicos
        // O mejor, si solo necesitas el nombre/avatar, podrías haberlos incluido en el groupBy si era posible,
        // pero dado el groupBy actual, la búsqueda adicional es necesaria.
        const topCompleterDetails = await prisma.user.findMany({
            where: { id: { in: topCompleterIds } },
            select: { id: true, name: true, avatar: true }
        });

        const topStudentsByCompletion = studentsByCompletionsRaw.map(s => {
            const userDetails = topCompleterDetails.find(u => u.id === s.userId);
            // Asegúrate de que el 'value' sea el conteo total de cursos completados por el estudiante
            return { id: s.userId, name: userDetails?.name || 'Usuario desconocido', avatar: userDetails?.avatar || null, value: s._count._all };
        });

        const stats: AdminDashboardStats = {
            totalUsers, // Esto ya es el número directo
            totalCourses,
            totalPublishedCourses,
            totalEnrollments,
            usersByRole: usersByRole.map(item => ({ role: item.role as UserRole, count: item._count._all })),
            coursesByStatus: coursesByStatus.map(item => ({ status: item.status as CourseStatus, count: item._count._all })),
            recentLogins: recentLoginLogs.length, // Conteo de IDs de usuario únicos para logins recientes
            newUsersLast7Days,
            userRegistrationTrend,
            courseActivity,
            averageCompletionRate: Math.round(averageCompletionRate),
            topCoursesByEnrollment,
            topCoursesByCompletion,
            lowestCoursesByCompletion,
            topStudentsByEnrollment: studentsByEnrollmentRaw.map(u => ({ id: u.id, name: u.name, avatar: u.avatar, value: u._count.enrollments })),
            topStudentsByCompletion,
            topInstructorsByCourses: instructorsByCoursesRaw.map(i => ({ id: i.id, name: i.name, avatar: i.avatar, value: i._count.courses })),
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
    }
}