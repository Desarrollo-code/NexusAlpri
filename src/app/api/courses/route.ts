
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { UserRole } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const manageView = searchParams.get('manageView') === 'true';
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') as UserRole;

    let whereClause: any = {};
    
    if (manageView) {
      if (userRole === 'INSTRUCTOR' && userId) {
        whereClause.instructorId = userId;
      }
      // Admins see all courses in manage view, so no additional filter.
    } else {
      // Regular catalog view only shows published courses
      whereClause.status = 'PUBLISHED';
    }

    const courses = await prisma.course.findMany({
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
        title: 'asc',
      },
    });
    
    // In manage view, we also want lesson counts for instructors/admins
    if (manageView) {
        const courseIds = courses.map(c => c.id);
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

        const coursesWithLessonsCount = courses.map(course => ({
            ...course,
            modulesCount: course._count.modules,
            lessonsCount: courseLessonsMap.get(course.id) || 0
        }));
        
        return NextResponse.json(coursesWithLessonsCount);
    }


    return NextResponse.json(courses);
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
                instructorId: session.id,
                status: 'DRAFT',
            },
        });

        return NextResponse.json(newCourse, { status: 201 });
    } catch (error) {
        console.error('[COURSE_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el curso' }, { status: 500 });
    }
}
