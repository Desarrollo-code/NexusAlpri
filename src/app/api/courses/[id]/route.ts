// src/app/api/courses/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { Module, Lesson, ContentBlock } from '@/types';

export const dynamic = 'force-dynamic';

// GET a specific course by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id;
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
                              orderBy: { id: 'asc' }, // Consistent order
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
    console.error(`[COURSE_GET_ERROR] ID: ${courseId}`, error);
    return NextResponse.json({ message: `Error al obtener el curso: ${(error as Error).message}` }, { status: 500 });
  }
}

// PUT (update) a course
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const courseId = params.id;
  
  try {
    const courseToUpdate = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseToUpdate) {
      return NextResponse.json({ message: 'Curso no encontrado para actualizar' }, { status: 404 });
    }

    if (session.role === 'INSTRUCTOR' && courseToUpdate.instructorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para actualizar este curso.' }, { status: 403 });
    }
    
    const body = await req.json();
    console.log("--- INICIO ACTUALIZACIÓN CURSO ---");
    console.log("1. BODY RECIBIDO DEL CLIENTE:", JSON.stringify(body, null, 2));

    const { title, description, category, imageUrl, status, publicationDate, modules } = body;

    const transactionOperations = [];

    // 1. Update Course basic info
    transactionOperations.push(
      prisma.course.update({
        where: { id: courseId },
        data: {
          title,
          description,
          category,
          imageUrl,
          status,
          publicationDate: publicationDate ? new Date(publicationDate) : null,
        },
      })
    );

    const existingModules = await prisma.module.findMany({ where: { courseId } });
    const existingLessons = await prisma.lesson.findMany({ where: { module: { courseId } } });
    const existingBlocks = await prisma.contentBlock.findMany({ where: { lesson: { module: { courseId } } } });

    const moduleIdsToDelete = existingModules.filter(em => !modules.some((m: Module) => m.id === em.id && !m._toBeDeleted)).map(m => m.id);
    const lessonIdsToDelete = existingLessons.filter(el => !modules.flatMap((m: Module) => m.lessons).some((l: Lesson) => l.id === el.id && !l._toBeDeleted)).map(l => l.id);
    const blockIdsToDelete = existingBlocks.filter(eb => !modules.flatMap((m: Module) => m.lessons).flatMap((l: Lesson) => l.contentBlocks).some((b: ContentBlock) => b.id === eb.id && !b._toBeDeleted)).map(b => b.id);
    
    console.log("2. IDs MARCADOS PARA ELIMINACIÓN:");
    console.log("   - Módulos a eliminar:", moduleIdsToDelete);
    console.log("   - Lecciones a eliminar:", lessonIdsToDelete);
    console.log("   - Bloques a eliminar:", blockIdsToDelete);

    // Deletions must happen first and in reverse order of dependency
    if(blockIdsToDelete.length > 0) transactionOperations.push(prisma.contentBlock.deleteMany({ where: { id: { in: blockIdsToDelete } } }));
    if(lessonIdsToDelete.length > 0) transactionOperations.push(prisma.lesson.deleteMany({ where: { id: { in: lessonIdsToDelete } } }));
    if(moduleIdsToDelete.length > 0) transactionOperations.push(prisma.module.deleteMany({ where: { id: { in: moduleIdsToDelete } } }));
    
    // Upsert Modules, Lessons, and ContentBlocks
    for (const [moduleIndex, module] of modules.entries()) {
        if (module._toBeDeleted) continue;
        transactionOperations.push(
            prisma.module.upsert({
                where: { id: module.id },
                update: { title: module.title, order: moduleIndex },
                create: { id: module.id, title: module.title, order: moduleIndex, courseId: courseId },
            })
        );

        for (const [lessonIndex, lesson] of module.lessons.entries()) {
            if (lesson._toBeDeleted) continue;
            transactionOperations.push(
                prisma.lesson.upsert({
                    where: { id: lesson.id },
                    update: { title: lesson.title, order: lessonIndex },
                    create: { id: lesson.id, title: lesson.title, order: lessonIndex, moduleId: module.id },
                })
            );
            
            for (const [blockIndex, block] of lesson.contentBlocks.entries()) {
                if (block._toBeDeleted) continue;
                const blockData = { type: block.type, content: block.content, order: blockIndex };
                transactionOperations.push(
                    prisma.contentBlock.upsert({
                        where: { id: block.id },
                        update: blockData,
                        create: { ...blockData, id: block.id, lessonId: lesson.id },
                    })
                );
                
                // Handle Quiz upsert within the same transaction if it's a QUIZ block
                if (block.type === 'QUIZ' && block.quiz) {
                     const { questions, ...quizData } = block.quiz;
                     transactionOperations.push(prisma.quiz.deleteMany({ where: { contentBlockId: block.id }}));
                     transactionOperations.push(
                        prisma.quiz.create({
                            data: {
                                ...quizData,
                                contentBlockId: block.id,
                                questions: {
                                    create: questions.map((q: any, qIndex: number) => ({
                                        ...q,
                                        order: qIndex,
                                        options: {
                                            create: q.options
                                        }
                                    }))
                                }
                            }
                        })
                     );
                }
            }
        }
    }
    
    console.log("3. EJECUTANDO TRANSACCIÓN EN LA BASE DE DATOS...");
    await prisma.$transaction(transactionOperations);
    console.log("4. TRANSACCIÓN COMPLETADA EXITOSAMENTE.");
    
    // Fetch the final, updated course state to return
    const finalUpdatedCourse = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            instructor: { select: { id: true, name: true } },
            modules: { include: { lessons: { include: { contentBlocks: { include: { quiz: { include: { questions: { include: { options: true }}}}}}}}}}
        },
    });
    
    console.log("--- FIN ACTUALIZACIÓN CURSO ---");
    return NextResponse.json(finalUpdatedCourse);

  } catch (error) {
    console.error(`[COURSE_PUT_ERROR] ID: ${courseId}`, error);
    return NextResponse.json({ message: `Error al actualizar el curso: ${(error as Error).message}` }, { status: 500 });
  }
}

// DELETE a course
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const courseId = params.id;
  try {
    const courseToDelete = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseToDelete) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    if (session.role === 'INSTRUCTOR' && courseToDelete.instructorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para eliminar este curso' }, { status: 403 });
    }
    
    // Use transaction for safe deletion
    await prisma.$transaction(async (tx) => {
        // Find all related data to delete
        const modules = await tx.module.findMany({ where: { courseId }, select: { id: true } });
        const moduleIds = modules.map(m => m.id);
        
        const lessons = await tx.lesson.findMany({ where: { moduleId: { in: moduleIds } }, select: { id: true } });
        const lessonIds = lessons.map(l => l.id);

        const contentBlocks = await tx.contentBlock.findMany({ where: { lessonId: { in: lessonIds } }, select: { id: true } });
        const contentBlockIds = contentBlocks.map(b => b.id);
        
        // Delete in correct order to respect foreign key constraints
        await tx.quiz.deleteMany({ where: { contentBlockId: { in: contentBlockIds } } });
        await tx.contentBlock.deleteMany({ where: { id: { in: contentBlockIds } } });
        await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
        await tx.module.deleteMany({ where: { id: { in: moduleIds } } });
        await tx.enrollment.deleteMany({ where: { courseId } });
        await tx.courseProgress.deleteMany({ where: { courseId } });
        
        // Finally, delete the course itself
        await tx.course.delete({ where: { id: courseId } });
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`[COURSE_DELETE_ERROR] ID: ${courseId}`, error);
    return NextResponse.json({ message: `Error al eliminar el curso: ${(error as Error).message}` }, { status: 500 });
  }
}
