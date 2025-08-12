// src/app/api/dashboard/admin-stats/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const sevenDaysAgo = startOfDay(subDays(today, 7));

    // Obtener conteos totales por separado para evitar posibles problemas con aggregate en transacción
    const totalUsersCount = await prisma.user.count();
    const totalCoursesCount = await prisma.course.count();
    const totalEnrollmentsCount = await prisma.enrollment.count();
    const thirtyDaysAgo = startOfDay(subDays(today, 30));

    const [
 totalUsersResult,
 totalCoursesResult,
      totalPublishedCoursesCount,
 totalEnrollmentsResult,
      recentLoginsCount,
      newUsersLast7DaysCount,
      recentUsersData,
      newCoursesData,
      publishedCoursesData,
      newEnrollmentsData,
      allCourseProgressRaw,
      coursesWithEnrollmentCounts,
      studentsByEnrollmentRaw,
      instructorsByCoursesRaw
 ,
 usersByRoleRaw,
 coursesByStatusRaw,
    ] = await prisma.$transaction([
      prisma.course.count({ where: { status: 'PUBLISHED' }}),

      // Agrupados (groupBy) — usar _all para contar por grupo
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.course.groupBy({ by: ['status'], _count: { _all: true } }),

      // Logins exitosos en los últimos 7 días (usa la tabla de logs de seguridad)
      prisma.securityLog.count({
        where: { event: 'SUCCESSFUL_LOGIN', createdAt: { gte: sevenDaysAgo } }
      }),

      // Nuevos usuarios en los últimos 7 días (ajusta el campo si tu usuario tiene otro nombre)
      prisma.user.count({
        where: { registeredDate: { gte: sevenDaysAgo } }
      }),

      // Datos para series temporales / gráficas (solo campos necesarios)
      prisma.user.findMany({
        where: { registeredDate: { gte: sevenDaysAgo } },
        select: { registeredDate: true }
      }),
      prisma.course.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
      }),
      prisma.course.findMany({
        where: { publicationDate: { not: null, gte: thirtyDaysAgo } },
        select: { publicationDate: true }
      }),
      prisma.enrollment.findMany({
        where: { enrolledAt: { gte: thirtyDaysAgo } },
        select: { enrolledAt: true }
      }),

      // Progreso de cursos (selecciono solo lo necesario)
      prisma.courseProgress.findMany({
        where: { enrollment: { userId: { not: null } } },
        select: { enrollment: { select: { userId: true, courseId: true } }, progressPercentage: true }
      }),

      // Cursos publicados + conteo de inscripciones
      prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, imageUrl: true, _count: { select: { enrollments: true } } }
      }),

      // Top estudiantes por enrollments
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, name: true, avatar: true, _count: { select: { enrollments: true } } },
        orderBy: { enrollments: { _count: 'desc' } },
        take: 5
      }),

      // Top instructores/administradores por cursos
      prisma.user.findMany({
        where: { role: { in: ['INSTRUCTOR', 'ADMINISTRATOR'] } },
        select: { id: true, name: true, avatar: true, _count: { select: { courses: true } } },
        orderBy: { courses: { _count: 'desc' } },
        take: 5
      })
    ]);

    // Normalizo resultados de aggregation y groupBy (_count._all)
    const usersByRole = usersByRoleRaw.map((r: any) => ({ role: r.role, count: r. _count. _all }));
    const coursesByStatus = coursesByStatusRaw.map((r: any) => ({ status: r.status, count: r. _count. _all }));

    const payload = {
      totalUsersCount,
      totalCoursesCount,
      totalPublishedCoursesCount,
      totalEnrollmentsCount,
      usersByRole,
      coursesByStatus,
      recentLoginsCount,
      newUsersLast7DaysCount,
      recentUsersData,
      newCoursesData,
      publishedCoursesData,
      newEnrollmentsData,
      allCourseProgressRaw,
      coursesWithEnrollmentCounts,
      studentsByEnrollmentRaw,
      instructorsByCoursesRaw
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener las estadísticas del dashboard' }, { status: 500 });
  }
}
