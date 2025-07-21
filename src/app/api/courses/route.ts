

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
    
    // Enrich with lesson counts for management view
    if (manageView) {
        const courseIds = courses.map(c => c.id);
        if (courseIds.length > 0) {
            const lessonsCountRaw = await prisma.lesson.groupBy({
                by: ['moduleId'],
                _count: { _all: true },
                where: { module: { courseId: { in: courseIds } } }
            });
            const modules = await prisma.module.findMany({
                where: { courseId: { in: courseIds } },
                select: { id: true, courseId: true }
            });

            const courseLessonsMap = new Map<string, number>();
            modules.forEach(module => {
                const lessonCount = lessonsCountRaw.find(lc => lc.moduleId === module.id)?._count._all || 0;
                courseLessonsMap.set(module.courseId, (courseLessonsMap.get(module.courseId) || 0) + lessonCount);
            });
            
            const enrichedCourses = courses.map(course => ({
                ...course,
                lessonsCount: courseLessonsMap.get(course.id) || 0,
            }));

            if (isPaginated) {
              return NextResponse.json({ courses: enrichedCourses, totalCourses });
            }
            return NextResponse.json(enrichedCourses);
        }
    }
    
    if (isPaginated) {
        return NextResponse.json({ courses, totalCourses });
    }

    return NextResponse.json({ courses, totalCourses: courses.length });
    
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
                instructor: true,
            }
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        console.error('[COURSE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el curso' }, { status: 500 });
    }
}
