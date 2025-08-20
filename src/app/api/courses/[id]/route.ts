// src/app/api/courses/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { Module, Lesson, ContentBlock } from '@/types';

export const dynamic = 'force-dynamic';

// GET a specific course by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  const { id: courseId } = params;
  
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

    // Inicia una transacción explícita
    const updatedCourseResult = await prisma.$transaction(async (tx) => {
        // 1. Update Course basic info
        await tx.course.update({
            where: { id: courseId },
            data: {
                title,
                description,
                category,
                imageUrl,
                status,
                publicationDate: publicationDate ? new Date(publicationDate) : null,
            },
        });

        const existingModules = await tx.module.findMany({ where: { courseId }, select: { id: true } });
        const clientModuleIds = modules.map((m: Module) => m.id);
        const moduleIdsToDelete = existingModules.filter(em => !clientModuleIds.includes(em.id)).map(m => m.id);
        
        console.log("Módulos a eliminar:", moduleIdsToDelete);
        if (moduleIdsToDelete.length > 0) {
            await tx.module.deleteMany({ where: { id: { in: moduleIdsToDelete } } });
        }
        
        for (const [moduleIndex, module] of modules.entries()) {
            await tx.module.upsert({
                where: { id: module.id },
                update: { title: module.title, order: moduleIndex },
                create: { id: module.id, title: module.title, order: moduleIndex, courseId: courseId },
            });
            
            const existingLessons = await tx.lesson.findMany({ where: { moduleId: module.id }, select: { id: true } });
            const clientLessonIds = module.lessons.map((l: Lesson) => l.id);
            const lessonIdsToDelete = existingLessons.filter(el => !clientLessonIds.includes(el.id)).map(l => l.id);

            console.log(`Lecciones a eliminar en módulo ${module.id}:`, lessonIdsToDelete);
            if (lessonIdsToDelete.length > 0) {
                 await tx.lesson.deleteMany({ where: { id: { in: lessonIdsToDelete } } });
            }

            for (const [lessonIndex, lesson] of module.lessons.entries()) {
                 await tx.lesson.upsert({
                    where: { id: lesson.id },
                    update: { title: lesson.title, order: lessonIndex },
                    create: { id: lesson.id, title: lesson.title, order: lessonIndex, moduleId: module.id },
                });
                
                const existingBlocks = await tx.contentBlock.findMany({ where: { lessonId: lesson.id }, select: { id: true }});
                const clientBlockIds = lesson.contentBlocks.map((b: ContentBlock) => b.id);
                const blockIdsToDelete = existingBlocks.filter(eb => !clientBlockIds.includes(eb.id)).map(b => b.id);
                
                console.log(`Bloques a eliminar en lección ${lesson.id}:`, blockIdsToDelete);
                if (blockIdsToDelete.length > 0) {
                    await tx.contentBlock.deleteMany({ where: { id: { in: blockIdsToDelete } } });
                }

                for (const [blockIndex, block] of lesson.contentBlocks.entries()) {
                    const blockData = { type: block.type, content: block.content, order: blockIndex };
                    await tx.contentBlock.upsert({
                        where: { id: block.id },
                        update: blockData,
                        create: { ...blockData, id: block.id, lessonId: lesson.id },
                    });

                    if (block.type === 'QUIZ') {
                        await tx.quiz.deleteMany({ where: { contentBlockId: block.id } }); // Clear old quiz data if any
                        if (block.quiz) {
                             const { questions, ...quizData } = block.quiz;
                             await tx.quiz.create({
                                data: {
                                    ...quizData,
                                    id: quizData.id || undefined,
                                    contentBlockId: block.id,
                                    questions: {
                                        create: questions.map((q: any, qIndex: number) => ({
                                            ...q,
                                            order: qIndex,
                                            options: { create: q.options },
                                        })),
                                    },
                                },
                            });
                        }
                    }
                }
            }
        }
        
        // Fetch the final state within the transaction
        return tx.course.findUnique({
            where: { id: courseId },
            include: {
                instructor: { select: { id: true, name: true } },
                modules: { orderBy: { order: 'asc'}, include: { lessons: { orderBy: { order: 'asc' }, include: { contentBlocks: { orderBy: { order: 'asc' }, include: { quiz: { include: { questions: { orderBy: { order: 'asc' }, include: { options: { orderBy: { id: 'asc' }}} } } } } } } } } } }
            },
        });
    });

    console.log("--- FIN ACTUALIZACIÓN CURSO ---");
    return NextResponse.json(updatedCourseResult);

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

  const { id: courseId } = params;
  try {
    const courseToDelete = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseToDelete) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    if (session.role === 'INSTRUCTOR' && courseToDelete.instructorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para eliminar este curso' }, { status: 403 });
    }
    
    await prisma.course.delete({ where: { id: courseId } });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`[COURSE_DELETE_ERROR] ID: ${courseId}`, error);
    return NextResponse.json({ message: `Error al eliminar el curso: ${(error as Error).message}` }, { status: 500 });
  }
}