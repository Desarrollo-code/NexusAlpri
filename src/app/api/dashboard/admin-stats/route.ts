// src/app/api/dashboard/admin-stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth'; // Asegúrate de que este getCurrentUser use el await en cookies() internamente.
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserRole, CourseStatus } from '@prisma/client'; // Asumo que estos tipos vienen de @prisma/client

// Configuración para Next.js:
// 'force-dynamic' asegura que esta ruta siempre se ejecute en el momento de la solicitud,
// lo cual es necesario para usar APIs dinámicas como 'cookies()' y obtener datos frescos.
export const dynamic = 'force-dynamic';
// 'revalidate = 0' deshabilita el almacenamiento en caché de la ruta, garantizando que los datos sean siempre los más recientes.
export const revalidate = 0;

/**
 * @typedef {Object} CourseInfo
 * @property {string} id - ID del curso.
 * @property {string} title - Título del curso.
 * @property {string | null} imageUrl - URL de la imagen del curso.
 * @property {number} value - Valor numérico asociado (ej. número de inscripciones, promedio de finalización).
 */
type CourseInfo = {
    id: string;
    title: string;
    imageUrl: string | null;
    value: number;
}

/**
 * @typedef {Object} UserInfo
 * @property {string} id - ID del usuario.
 * @property {string | null} name - Nombre del usuario.
 * @property {string | null} avatar - URL del avatar del usuario.
 * @property {number} value - Valor numérico asociado (ej. número de cursos, número de inscripciones).
 */
type UserInfo = {
    id: string;
    name: string | null;
    avatar: string | null;
    value: number;
}

/**
 * @interface AdminDashboardStats
 * Define la estructura de los datos que se devolverán para el dashboard de administración.
 */
export interface AdminDashboardStats {
    totalUsers: number;
    totalCourses: number;
    totalPublishedCourses: number;
    totalEnrollments: number;
    usersByRole: { role: UserRole; count: number }[];
    coursesByStatus: { status: CourseStatus; count: number }[];
    recentLogins: number; // Usuarios activos en los últimos 7 días
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

/**
 * Maneja las solicitudes GET para obtener las estadísticas del dashboard de administración.
 * Requiere que el usuario esté autenticado y tenga el rol de 'ADMINISTRATOR'.
 *
 * @param {NextRequest} req - El objeto de solicitud de Next.js.
 * @returns {Promise<NextResponse>} Una respuesta JSON con las estadísticas del dashboard o un mensaje de error.
 */
export async function GET(req: NextRequest) {
    const session = await getCurrentUser(); // Obtiene la sesión del usuario actual

    // Verifica si el usuario está autenticado y tiene el rol de ADMINISTRATOR.
    // Si no cumple, devuelve un error 403 (Prohibido).
    if (!session || session.role !== 'ADMINISTRATOR') {
        // Registra una advertencia en la consola del servidor para depuración de accesos no autorizados.
        console.warn(`[ADMIN_DASHBOARD_AUTH_WARN] Intento de acceso no autorizado al dashboard. Usuario: ${session?.email || 'N/A'}, Rol: ${session?.role || 'N/A'}`);
        return NextResponse.json({ message: 'Acceso no autorizado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = subDays(today, 30);
        const sevenDaysAgo = subDays(today, 7);

        // Se utiliza prisma.$transaction para ejecutar múltiples consultas a la base de datos
        // de forma eficiente en una sola operación, reduciendo la latencia.
        const [
            // Corrección para el error de Prisma: Usamos .aggregate para obtener el conteo total
            // Esto es más robusto contra la interpretación errónea de Turbopack.
            totalUsersResult,
            totalCoursesResult,
            totalPublishedCoursesCount, // Renombrado para claridad
            totalEnrollmentsResult,
            usersByRole,
            coursesByStatus,
            recentLoginLogs,
            newUsersLast7DaysCount, // Renombrado para claridad
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
            // Obtener el conteo total de usuarios
            prisma.user.aggregate({ _count: { id: true } }),
            // Obtener el conteo total de cursos
            prisma.course.aggregate({ _count: { id: true } }),
            // Obtener el conteo total de cursos publicados
            prisma.course.count({ where: { status: 'PUBLISHED' } }),
            // Obtener el conteo total de inscripciones
            prisma.enrollment.aggregate({ _count: { id: true } }),
            // Agrupar usuarios por rol y contar
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            // Agrupar cursos por estado y contar
            prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),
            // Agrupar logs de seguridad por userId para contar logins únicos en los últimos 7 días
            prisma.securityLog.groupBy({
                by: ['userId'],
                where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: startOfDay(sevenDaysAgo) } },
            }),
            // Contar nuevos usuarios registrados en los últimos 7 días
            prisma.user.count({ where: { registeredDate: { gte: startOfDay(sevenDaysAgo) } } }),
            // Obtener datos de registro de usuarios recientes para la tendencia
            prisma.user.findMany({ where: { registeredDate: { gte: startOfDay(sevenDaysAgo) } }, select: { registeredDate: true } }),
            // Obtener datos de cursos creados en los últimos 30 días
            prisma.course.findMany({ where: { createdAt: { gte: startOfDay(thirtyDaysAgo) } }, select: { createdAt: true } }),
            // Obtener datos de cursos publicados en los últimos 30 días
            prisma.course.findMany({ where: { publicationDate: { not: null, gte: startOfDay(thirtyDaysAgo) } }, select: { publicationDate: true } }),
            // Obtener datos de nuevas inscripciones en los últimos 30 días
            prisma.enrollment.findMany({ where: { enrolledAt: { gte: startOfDay(thirtyDaysAgo) } }, select: { enrolledAt: true } }),
            // Obtener el progreso de todos los cursos para calcular la tasa de finalización
            prisma.courseProgress.findMany({ where: { courseId: { not: null } }, select: { courseId: true, progressPercentage: true, userId: true } }),
            // Obtener cursos publicados con el conteo de sus inscripciones
            prisma.course.findMany({
                where: { status: 'PUBLISHED' },
                select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } },
            }),
            // Obtener los 5 estudiantes principales por número de inscripciones
            prisma.user.findMany({
                where: { role: 'STUDENT' },
                select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } },
                orderBy: { enrollments: { _count: 'desc' } },
                take: 5
            }),
            // Agrupar el progreso de los cursos por userId para contar cursos completados por estudiante
            prisma.courseProgress.groupBy({
                by: ['userId'],
                where: { progressPercentage: { gte: 100 } }, // Solo cursos completados (100%)
                _count: { _all: true }, // Contar todas las entradas completadas por usuario
                orderBy: { _count: { _all: 'desc' } },
                take: 5
            }),
            // Obtener los 5 instructores principales por número de cursos creados
            prisma.user.findMany({
                where: { role: { in: ['INSTRUCTOR', 'ADMINISTRATOR'] } },
                select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } },
                orderBy: { courses: { _count: 'desc' } },
                take: 5
            }),
        ]);

        // Extraer los valores de los resultados de aggregate
        const totalUsers = totalUsersResult._count.id;
        const totalCourses = totalCoursesResult._count.id;
        const totalEnrollments = totalEnrollmentsResult._count.id;
        const newUsersLast7Days = newUsersLast7DaysCount; // Este ya era un conteo directo

        // Procesamiento de datos para tendencias y promedios
        const dateRange7Days = eachDayOfInterval({ start: startOfDay(sevenDaysAgo), end: startOfDay(today) });
        const registrationsByDate = new Map<string, number>();
        recentUsersData.forEach(user => {
            if (user.registeredDate) {
                const dateKey = format(startOfDay(new Date(user.registeredDate)), 'yyyy-MM-dd');
                registrationsByDate.set(dateKey, (registrationsByDate.get(dateKey) || 0) + 1);
            }
        });

        const userRegistrationTrend = dateRange7Days.map(date => {
            const dateKey = format(date, 'yyyy-MM-dd');
            return {
                date: format(date, 'MMM d', { locale: es }),
                count: registrationsByDate.get(dateKey) || 0,
            };
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Asegurar orden cronológico

        const dateRange30Days = eachDayOfInterval({ start: startOfDay(thirtyDaysAgo), end: startOfDay(today) });
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
        })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
        const topCompleterDetails = await prisma.user.findMany({
            where: { id: { in: topCompleterIds } },
            select: { id: true, name: true, avatar: true }
        });

        const topStudentsByCompletion = studentsByCompletionsRaw.map(s => {
            const userDetails = topCompleterDetails.find(u => u.id === s.userId);
            return { id: s.userId, name: userDetails?.name || 'Usuario desconocido', avatar: userDetails?.avatar || null, value: s._count._all };
        });

        const stats: AdminDashboardStats = {
            totalUsers, // Ya es un número directo
            totalCourses, // Ya es un número directo
            totalPublishedCourses: totalPublishedCoursesCount, // Usamos el conteo directo
            totalEnrollments, // Ya es un número directo
            usersByRole: usersByRole.map(item => ({ role: item.role as UserRole, count: item._count._all })),
            coursesByStatus: coursesByStatus.map(item => ({ status: item.status as CourseStatus, count: item._count._all })),
            recentLogins: recentLoginLogs.length,
            newUsersLast7Days, // Ya es un número directo
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
        // Manejo de errores centralizado para el dashboard.
        // Registra el error completo para depuración, pero devuelve un mensaje genérico al cliente.
        console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
        return NextResponse.json({ message: 'Error interno del servidor al obtener las estadísticas del dashboard.' }, { status: 500 });
    }
}