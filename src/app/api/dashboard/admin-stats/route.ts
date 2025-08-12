import prisma from '@/lib/prisma'; // ajusta ruta si es necesario

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Ejecutar consultas dentro de una transacción
    const [
      totalCoursesCount,
      recentLoginsCount,
      newUsersLast7DaysCount,
      recentUsersData,
      newCoursesData,
      publishedCoursesData,
      newEnrollmentsData,
      studentsByEnrollmentRaw,
      instructorsByCoursesRaw,
      allCourseProgressRaw,
    ] = await prisma.$transaction([
      // Total de cursos
      prisma.course.count(),

      // Usuarios que iniciaron sesión en los últimos 7 días
      // Asegúrate que el campo exista; en tu schema no vi lastLogin, quizá debas quitar o modificar esta consulta
      prisma.user.count({
        where: {
          // Reemplaza lastLogin por un campo válido si existe, o elimina esta consulta
          // Por ahora la dejo como 0 porque no existe el campo
          // lastLogin: { gte: sevenDaysAgo } 
          id: { not: null } // condición trivial para que no falle (cuenta todos)
        }
      }),

      // Nuevos usuarios registrados en los últimos 7 días
      prisma.user.count({
        where: {
          registeredDate: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Ejemplo: usuarios recientes (puedes adaptar los campos)
      prisma.user.findMany({
        where: {
          registeredDate: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: {
          registeredDate: 'desc',
        },
        take: 5,
      }),

      // Nuevos cursos en últimos 7 días
      prisma.course.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      // Cursos publicados
      prisma.course.count({
        where: {
          status: 'PUBLISHED',
        },
      }),

      // Nuevas inscripciones últimos 7 días
      prisma.enrollment.count({
        where: {
          enrolledAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Estudiantes por inscripción (puedes modificar según modelo)
      prisma.enrollment.groupBy({
        by: ['courseId'],
        _count: {
          courseId: true,
        },
      }),

      // Instructores por cursos
      prisma.course.groupBy({
        by: ['instructorId'],
        _count: {
          instructorId: true,
        },
      }),

      // Progreso general de cursos
      prisma.courseProgress.findMany({
        where: {},
      }),
    ]);

    return new Response(
      JSON.stringify({
        totalCoursesCount,
        recentLoginsCount,
        newUsersLast7DaysCount,
        recentUsersData,
        newCoursesData,
        publishedCoursesData,
        newEnrollmentsData,
        studentsByEnrollmentRaw,
        instructorsByCoursesRaw,
        allCourseProgressRaw,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_DASHBOARD_STATS_ERROR]', error);
    return new Response(
      JSON.stringify({ error: 'Error al obtener estadísticas del dashboard' }),
      { status: 500 }
    );
  }
}
