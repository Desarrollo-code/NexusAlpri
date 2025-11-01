// src/app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, ContentBlock, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption } from '@/types';
import { checkCourseOwnership } from "@/lib/auth-utils";
import { supabaseAdmin } from "@/lib/supabase-client";

export const dynamic = "force-dynamic";

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
        instructor: { select: { id: true, name: true, avatar: true } },
        prerequisite: { select: { id: true, title: true } },
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
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const { id: courseId } = params;
  
  if (!(await checkCourseOwnership(session, courseId))) {
      return NextResponse.json({ message: 'No tienes permiso para actualizar este curso' }, { status: 403 });
  }

  try {
    const body: AppCourse = await req.json();
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
          certificateTemplateId: courseData.certificateTemplateId,
          isMandatory: courseData.isMandatory,
          prerequisiteId: courseData.prerequisiteId,
        },
      });
      
      // 2. Clean slate: Delete all existing modules for this course
      await tx.module.deleteMany({ where: { courseId } });

      // 3. Re-create all modules, lessons, and content blocks from scratch
      for (const [moduleIndex, moduleData] of modules.entries()) {
        const newModule = await tx.module.create({
          data: {
            title: moduleData.title,
            order: moduleIndex,
            courseId: courseId,
          },
        });

        for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
          const newLesson = await tx.lesson.create({
            data: {
              title: lessonData.title,
              order: lessonIndex,
              moduleId: newModule.id,
            },
          });

          for (const [blockIndex, blockData] of lessonData.contentBlocks.entries()) {
            const newBlock = await tx.contentBlock.create({
              data: {
                type: blockData.type,
                content: blockData.content || '',
                order: blockIndex,
                lessonId: newLesson.id,
              },
            });

            if (blockData.type === 'QUIZ' && blockData.quiz) {
              const newQuiz = await tx.quiz.create({
                data: {
                  title: blockData.quiz.title,
                  description: blockData.quiz.description || '',
                  maxAttempts: blockData.quiz.maxAttempts,
                  contentBlockId: newBlock.id,
                },
              });

              for (const [qIndex, questionData] of blockData.quiz.questions.entries()) {
                const newQuestion = await tx.question.create({
                  data: {
                    text: questionData.text,
                    order: qIndex,
                    type: 'SINGLE_CHOICE',
                    quizId: newQuiz.id,
                  },
                });

                if (questionData.options?.length > 0) {
                  await tx.answerOption.createMany({
                    data: questionData.options.map(opt => ({
                      text: opt.text,
                      isCorrect: opt.isCorrect,
                      feedback: opt.feedback || null,
                      points: opt.points || 0,
                      questionId: newQuestion.id,
                    })),
                  });
                }
              }
            }
          }
        }
      }
    }, {
      maxWait: 20000,
      timeout: 40000,
    });

    // Devolver el estado completo y actualizado del curso
    const finalCourseState = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            instructor: { select: { id: true, name: true, avatar: true } },
            prerequisite: { select: { id: true, title: true } },
            modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, include: { contentBlocks: { orderBy: { order: "asc" }, include: { quiz: { include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { id: "asc" } } } } } } } } } } } }
        },
    });

    return NextResponse.json(finalCourseState);
  } catch (error) {
    console.error(`[UPDATE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json({ message: `Error al actualizar el curso: ${(error as Error).message}` }, { status: 500 });
  }
}

// DELETE course by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id: courseId } = params;
  
  if (!(await checkCourseOwnership(session, courseId))) {
      return NextResponse.json({ message: 'No tienes permiso para eliminar este curso' }, { status: 403 });
  }

  try {
    await prisma.$transaction(async (tx) => {
        // 1. Encontrar todos los anuncios que mencionan este curso para obtener sus IDs
        const announcementsToDelete = await tx.announcement.findMany({
            where: { content: { contains: `/courses/${courseId}` } },
            select: { id: true }
        });
        const announcementIds = announcementsToDelete.map(a => a.id);

        // 2. Eliminar todas las notificaciones relacionadas
        await tx.notification.deleteMany({
            where: {
                OR: [
                    { link: `/courses/${courseId}` },
                    { link: `/manage-courses/${courseId}/edit` },
                    { announcementId: { in: announcementIds } }
                ]
            }
        });

        // 3. Eliminar los anuncios en sí
        if (announcementIds.length > 0) {
            await tx.announcement.deleteMany({ where: { id: { in: announcementIds } } });
        }

        // 4. Eliminar asignaciones de cursos
        await tx.courseAssignment.deleteMany({ where: { courseId: courseId } });

        // 5. Finalmente, eliminar el curso
        await tx.course.delete({ where: { id: courseId } });
    });
    
    if (supabaseAdmin) {
        const channel = supabaseAdmin.channel('courses');
        await channel.send({
            type: 'broadcast',
            event: 'course_deleted',
            payload: { id: courseId },
        });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json({ message: "Error al eliminar el curso" }, { status: 500 });
  }
}
