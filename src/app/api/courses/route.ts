
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const manageView = searchParams.get('manageView') === 'true';
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') as UserRole;
    
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const isPaginated = pageParam && pageSizeParam;
    
    const page = parseInt(pageParam || '1', 10);
    const pageSize = parseInt(pageSizeParam || '100', 10);
    const tab = searchParams.get('tab');
    const skip = (page - 1) * pageSize;

    let whereClause: any = {};
    
    if (manageView) {
      if (userRole === 'INSTRUCTOR' && userId) {
        whereClause.instructorId = userId;
      }
      if (tab && tab !== 'all') {
        whereClause.status = tab as CourseStatus;
      }
    } else {
      whereClause.status = 'PUBLISHED';
    }

    const [courses, totalCourses] = await prisma.$transaction([
      prisma.course.findMany({
        where: whereClause,
        include: {
          instructor: { select: { id: true, name: true } },
          _count: { select: { modules: true } }, // Mantengo el conteo de módulos aquí
        },
        orderBy: { createdAt: 'desc' },
        ...(isPaginated && { skip, take: pageSize }),
      }),
      prisma.course.count({ where: whereClause }),
    ]);
    
    // El conteo de lecciones ya no es necesario aquí, se simplifica el proceso.
    // La información de `_count.modules` ya es correcta y se pasa directamente.
    const enrichedCourses = courses.map((course: any) => ({
      ...course,
      modulesCount: course._count?.modules ?? 0, // Usamos el conteo directo de Prisma
      lessonsCount: 0, // Este campo ya no se usa en la tarjeta pero lo mantenemos por consistencia del tipo
    }));

    return NextResponse.json({ courses: enrichedCourses, totalCourses });
    
  } catch (error) {
    console.error('[COURSES_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener los cursos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, category } = body;
    
    if (!title || !description) {
      return NextResponse.json({ message: 'Título y descripción son requeridos' }, { status: 400 });
    }

    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        category: category || 'General',
        status: 'DRAFT',
        instructor: { connect: { id: session.id } },
      },
      include: { instructor: true },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('[COURSE_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error al crear el curso' }, { status: 500 });
  }
}
