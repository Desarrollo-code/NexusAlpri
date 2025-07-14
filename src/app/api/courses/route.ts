
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { UserRole, CourseStatus } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const manageView = searchParams.get('manageView') === 'true';
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') as UserRole;
    
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const isPaginated = pageParam && pageSizeParam;
    
    const page = parseInt(pageParam || '1', 10);
    const pageSize = parseInt(pageSizeParam || '100', 10); // Default to a high number if not paginated
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
                instructor: {
                select: { id: true, name: true },
                },
                _count: {
                select: { modules: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            ...(isPaginated && { skip, take: pageSize })
        }),
        prisma.course.count({ where: whereClause })
    ]);
    
    let coursesToReturn: any[] = courses;

    if (manageView) {
        const courseIds = courses.map(c => c.id);

        if (courseIds.length > 0) {
            const lessonsCount = await prisma.lesson.groupBy({
                by: ['moduleId'],
                where: {
                    module: {
                        courseId: {
                            in: courseIds,
                        }
                    }
                },
                _count: { _all: true },
            });

            const moduleToCourseMap = await prisma.module.findMany({
                where: { courseId: { in: courseIds } },
                select: { id: true, courseId: true }
            });

            const courseLessonsMap = new Map<string, number>();
            for (const module of moduleToCourseMap) {
                const count = lessonsCount.find(lc => lc.moduleId === module.id)?._count._all || 0;
                courseLessonsMap.set(module.courseId, (courseLessonsMap.get(module.courseId) || 0) + count);
            }

            coursesToReturn = courses.map(course => ({
                ...course,
                modulesCount: course._count.modules,
                lessonsCount: courseLessonsMap.get(course.id) || 0
            }));
        }
    }
    
    if (isPaginated) {
        return NextResponse.json({ courses: coursesToReturn, totalCourses });
    }

    // For non-paginated requests, return the array directly for backward compatibility
    return NextResponse.json(coursesToReturn);
    
  } catch (error) {
    console.error('[COURSES_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener los cursos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    const session = await getSession(req);
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
                instructor: {
                    connect: {
                        id: session.id,
                    },
                },
            },
            include: {
                instructor: true, // Include instructor details in the response
            }
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        console.error('[COURSE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el curso' }, { status: 500 });
    }
}
