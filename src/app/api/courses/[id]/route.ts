// src/app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET a specific course by ID
export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const { id: courseId } = params;
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                contentBlocks: {
                  orderBy: { order: 'asc' },
                  include: {
                    quiz: {
                      include: {
                        questions: {
                          orderBy: { order: 'asc' },
                          include: {
                            options: {
                              orderBy: { id: 'asc' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (error) {
    console.error(`[GET_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json({ message: 'Error al obtener el curso' }, { status: 500 });
  }
}


// UPDATE course by ID
export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }
  const { id: courseId } = params;

  try {
    const body = await req.json();

    const courseToUpdate = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!courseToUpdate) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMINISTRATOR' && courseToUpdate.instructorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para actualizar este curso' }, { status: 403 });
    }

    const { modules, ...courseData } = body;
    
    // Process modules, lessons, and content blocks
    const transactionOperations = [];

    // Update basic course data
    transactionOperations.push(
        prisma.course.update({
            where: { id: courseId },
            data: {
                ...courseData,
                publicationDate: courseData.publicationDate ? new Date(courseData.publicationDate) : null,
            },
        })
    );

    // Get current state from DB
    const currentModules = await prisma.module.findMany({ where: { courseId }, select: { id: true } });
    const currentModuleIds = new Set(currentModules.map(m => m.id));

    // Upsert modules
    for (const module of modules) {
        const moduleData = {
            title: module.title,
            order: module.order,
            courseId: courseId,
        };
        const op = prisma.module.upsert({
            where: { id: module.id.startsWith('new-') ? '' : module.id },
            create: moduleData,
            update: moduleData,
        });
        transactionOperations.push(op);
        currentModuleIds.delete(module.id);
    }
    
    // Delete modules that are no longer present
    if (currentModuleIds.size > 0) {
        transactionOperations.push(prisma.module.deleteMany({ where: { id: { in: Array.from(currentModuleIds) } } }));
    }
    
    // This is a simplified version. A full implementation would handle lessons and blocks similarly.
    // For now, focusing on the main structure.
    
    const updatedCourse = await prisma.$transaction(transactionOperations);
    
    // Return the latest state of the course after all operations.
    const finalCourseState = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            modules: { orderBy: { order: 'asc' },
                include: { lessons: { orderBy: { order: 'asc' }, 
                    include: { contentBlocks: { orderBy: { order: 'asc' }, 
                        include: { quiz: { include: { questions: { orderBy: { order: 'asc' }, 
                            include: { options: { orderBy: { id: 'asc' } } }
                        }}}
                    }}
                }}
            }}
        },
    });

    return NextResponse.json(finalCourseState);

  } catch (error) {
    console.error(`[UPDATE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json({ message: 'Error al actualizar el curso' }, { status: 500 });
  }
}


// DELETE course by ID
export async function DELETE(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }
  
  const { id: courseId } = params;

  try {
    const courseToDelete = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true }
    });

    if (!courseToDelete) {
        return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    if (session.role === 'INSTRUCTOR' && courseToDelete.instructorId !== session.id) {
        return NextResponse.json({ message: "No tienes permiso para eliminar este curso" }, { status: 403 });
    }
    
    await prisma.course.delete({
      where: { id: courseId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json({ message: 'Error al eliminar el curso' }, { status: 500 });
  }
}
