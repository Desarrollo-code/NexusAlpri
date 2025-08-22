// src/app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, ContentBlock, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption } from '@/types';

export const dynamic = "force-dynamic";

// GET a specific course by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { id: true, name: true } },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                contentBlocks: {
                  orderBy: { order: "asc" },
                  include: {
                    quiz: {
                      include: {
                        questions: {
                          orderBy: { order: "asc" },
                          include: {
                            options: { orderBy: { id: "asc" } },
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
      return NextResponse.json(
        { message: "Curso no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(course);
  } catch (error) {
    console.error(`[GET_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json(
      { message: "Error al obtener el curso" },
      { status: 500 }
    );
  }
}

// UPDATE course by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const { id: courseId } = await params;

  try {
    const body: AppCourse = await req.json();

    const courseToUpdate = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!courseToUpdate) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    if (session.role !== "ADMINISTRATOR" && courseToUpdate.instructorId !== session.id) {
      return NextResponse.json({ message: "No tienes permiso para actualizar este curso" }, { status: 403 });
    }
    
    const { modules, ...courseData } = body;
    
    await prisma.$transaction(async (tx) => {
        // 1. Update course-level data
        await tx.course.update({
            where: { id: courseId },
            data: {
                title: courseData.title,
                description: courseData.description,
                imageUrl: courseData.imageUrl,
                category: courseData.category,
                status: courseData.status,
                publicationDate: courseData.publicationDate ? new Date(courseData.publicationDate) : null,
            },
        });
        
        const existingModules = await tx.module.findMany({ where: { courseId }, select: { id: true, lessons: { select: { id: true } } } });
        const incomingModuleIds = new Set(modules.map(m => !m.id.startsWith('new-') ? m.id : undefined).filter(Boolean));
        
        // 2. Delete modules that are no longer present
        const modulesToDelete = existingModules.filter(m => !incomingModuleIds.has(m.id));
        if (modulesToDelete.length > 0) {
            await tx.module.deleteMany({ where: { id: { in: modulesToDelete.map(m => m.id) } }});
        }
        
        // 3. Upsert modules and their nested content
        for (const [moduleIndex, moduleData] of modules.entries()) {
            const isNewModule = moduleData.id.startsWith('new-');
            
            const savedModule = await tx.module.upsert({
                where: { id: isNewModule ? `__NEVER_FIND__${moduleData.id}` : moduleData.id },
                create: { title: moduleData.title, order: moduleIndex, courseId },
                update: { title: moduleData.title, order: moduleIndex },
            });
            
            const existingLessons = await tx.lesson.findMany({ where: { moduleId: savedModule.id }, select: { id: true } });
            const incomingLessonIds = new Set(moduleData.lessons.map(l => !l.id.startsWith('new-') ? l.id : undefined).filter(Boolean));

            // 4. Delete lessons no longer in the module
            const lessonsToDelete = existingLessons.filter(l => !incomingLessonIds.has(l.id));
            if (lessonsToDelete.length > 0) {
                await tx.lesson.deleteMany({ where: { id: { in: lessonsToDelete.map(l => l.id) } }});
            }

            for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
                const isNewLesson = lessonData.id.startsWith('new-');
                const savedLesson = await tx.lesson.upsert({
                    where: { id: isNewLesson ? `__NEVER_FIND__${lessonData.id}` : lessonData.id },
                    create: { title: lessonData.title, order: lessonIndex, moduleId: savedModule.id },
                    update: { title: lessonData.title, order: lessonIndex },
                });
                
                const existingBlocks = await tx.contentBlock.findMany({ where: { lessonId: savedLesson.id }, select: { id: true }});
                const incomingBlockIds = new Set(lessonData.contentBlocks.map(b => !b.id.startsWith('new-') ? b.id : undefined).filter(Boolean));
                
                // 5. Delete blocks no longer in the lesson
                 const blocksToDelete = existingBlocks.filter(b => !incomingBlockIds.has(b.id));
                 if (blocksToDelete.length > 0) {
                    await tx.contentBlock.deleteMany({ where: { id: { in: blocksToDelete.map(b => b.id) } }});
                }

                for (const [blockIndex, blockData] of lessonData.contentBlocks.entries()) {
                    const isNewBlock = blockData.id.startsWith('new-');
                    const savedBlock = await tx.contentBlock.upsert({
                        where: { id: isNewBlock ? `__NEVER_FIND__${blockData.id}` : blockData.id },
                        create: { type: blockData.type, content: blockData.content || '', order: blockIndex, lessonId: savedLesson.id },
                        update: { type: blockData.type, content: blockData.content || '', order: blockIndex },
                    });

                    if (blockData.type === 'QUIZ' && blockData.quiz) {
                        const isNewQuiz = blockData.quiz.id.startsWith('new-');
                        const quizData = { title: blockData.quiz.title, description: blockData.quiz.description || '', contentBlockId: savedBlock.id };
                        const savedQuiz = await tx.quiz.upsert({
                             where: { id: isNewQuiz ? `__NEVER_FIND__${blockData.quiz.id}` : blockData.quiz.id },
                             create: quizData,
                             update: quizData,
                        });
                        // Placeholder: Handle quiz questions and options with similar delete/upsert logic if needed
                    }
                }
            }
        }
    });

    const finalCourseState = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            instructor: { select: { id: true, name: true } },
            modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, include: { contentBlocks: { orderBy: { order: "asc" }, include: { quiz: { include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { id: "asc" } } } } } } } } } } } }
        },
    });

    return NextResponse.json(finalCourseState);
  } catch (error) {
    console.error(`[UPDATE_COURSE_ID: ${courseId}]`, error);
    if (error instanceof prisma.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: "Error de guardado: Uno de los elementos a actualizar no fue encontrado." }, { status: 404 });
    }
    return NextResponse.json({ message: "Error al actualizar el curso" }, { status: 500 });
  }
}

// DELETE course by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMINISTRATOR" && session.role !== "INSTRUCTOR")) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id: courseId } = await params;

  try {
    const courseToDelete = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!courseToDelete) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    if (session.role === "INSTRUCTOR" && courseToDelete.instructorId !== session.id) {
      return NextResponse.json({ message: "No tienes permiso para eliminar este curso" }, { status: 403 });
    }

    await prisma.course.delete({ where: { id: courseId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json({ message: "Error al eliminar el curso" }, { status: 500 });
  }
}
