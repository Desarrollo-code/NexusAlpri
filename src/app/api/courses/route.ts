// src/app/api/courses/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole, CourseStatus } from '@/types';
import prisma from '@/lib/prisma';
import { mapApiCourseToAppCourse } from '@/lib/course-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const manageView = searchParams.get('manageView') === 'true';
    const simpleView = searchParams.get('simple') === 'true';
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') as UserRole;
    
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const isPaginated = pageParam && pageSizeParam;
    
    const page = parseInt(pageParam || '1', 10);
    const pageSize = parseInt(pageSizeParam || '100', 10);
    const tab = searchParams.get('tab');
    const skip = (page - 1) * pageSize;

    // --- Vista Simplificada para Selectores ---
    if (simpleView) {
        if (!session) {
             return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
        }
        const courses = await prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
            },
            select: {
                id: true,
                title: true,
            },
            orderBy: {
                title: 'asc',
            },
        });
        return NextResponse.json({ courses });
    }

    // --- Vistas de Gestión y Catálogo ---
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
      if (userId) {
          whereClause.instructorId = { not: userId };
      }
    }

    const courseInclude = {
      instructor: { select: { id: true, name: true, avatar: true } },
      prerequisite: { select: { id: true, title: true } },
      _count: {
        select: {
          modules: true,
          ...(manageView && { enrollments: true }),
        },
      },
      ...(manageView && {
        enrollments: {
          select: {
            progress: {
              select: {
                progressPercentage: true,
              },
            },
          },
        },
      }),
    };

    const coursesFromDb = await prisma.course.findMany({
        where: whereClause,
        include: courseInclude,
        orderBy: { createdAt: 'desc' },
        ...(isPaginated && { skip, take: pageSize }),
    });

    let coursesWithPrereqCompletion;

    if (userId) {
      const prerequisiteIds = coursesFromDb
        .map(course => course.prerequisiteId)
        .filter((id): id is string => id !== null);

      let completedPrereqs = new Set<string>();

      if (prerequisiteIds.length > 0) {
        const prereqProgress = await prisma.courseProgress.findMany({
          where: {
            userId: userId,
            courseId: { in: prerequisiteIds },
            completedAt: { not: null },
          },
          select: { courseId: true }
        });
        completedPrereqs = new Set(prereqProgress.map(p => p.courseId));
      }

      coursesWithPrereqCompletion = coursesFromDb.map(course => ({
        ...course,
        prerequisiteCompleted: !course.prerequisiteId || completedPrereqs.has(course.prerequisiteId),
      }));

    } else {
        coursesWithPrereqCompletion = coursesFromDb.map(c => ({...c, prerequisiteCompleted: true}));
    }

    const totalCourses = await prisma.course.count({ where: whereClause });
    
    const enrichedCourses = coursesWithPrereqCompletion.map((course: any) => {
      let averageCompletion = 0;
      if (manageView && course.enrollments && course.enrollments.length > 0) {
        const validProgress = course.enrollments
          .map((e: any) => e.progress?.progressPercentage)
          .filter((p: any) => p !== null && p !== undefined);
        
        if (validProgress.length > 0) {
            averageCompletion = validProgress.reduce((acc: number, curr: number) => acc + curr, 0) / validProgress.length;
        }
      }
      
      const { enrollments, ...restOfCourse } = course;

      return {
        ...restOfCourse,
        averageCompletion: averageCompletion,
      };
    }).map(c => mapApiCourseToAppCourse(c));

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
        prerequisiteId: null, // Corrección: Explicitar que es null
      },
      include: { instructor: true },
    });

    // --- SECURITY LOG (NON-BLOCKING) ---
    Promise.resolve().then(async () => {
        try {
            const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? null;
            const country = req.geo?.country ?? null;
            const city = req.geo?.city ?? null;

            await prisma.securityLog.create({
              data: {
                event: 'COURSE_CREATED',
                ipAddress: ip,
                userId: session.id,
                details: `Curso creado: "${newCourse.title}" (ID: ${newCourse.id}).`,
                userAgent: req.headers.get('user-agent'),
                country,
                city,
              }
            });
        } catch (logError) {
            console.error("Failed to write security log for COURSE_CREATED, but the course was created successfully:", logError);
        }
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('[COURSE_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error al crear el curso' }, { status: 500 });
  }
}
