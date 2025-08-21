// src/app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET a specific course by ID
export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const { id: courseId } = context.params;
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


// UPDATE course by ID (Re-architected for full nesting)
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const { id: courseId } = context.params;

  try {
    const body = await req.json();

    const courseToUpdate = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, modules: { include: { lessons: { include: { contentBlocks: true } } } } },
    });

    if (!courseToUpdate) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    if (session.role !== "ADMINISTRATOR" && courseToUpdate.instructorId !== session.id) {
      return NextResponse.json({ message: "No tienes permiso para actualizar este curso" }, { status: 403 });
    }

    const { modules, ...courseData } = body;

    await prisma.$transaction(async (tx) => {
      // 1. Update basic course data
      await tx.course.update({
        where: { id: courseId },
        data: {
          ...courseData,
          publicationDate: courseData.publicationDate ? new Date(courseData.publicationDate) : null,
        },
      });

      // 2. Handle Modules, Lessons, and Content Blocks
      const currentModules = courseToUpdate.modules;
      const incomingModuleIds = new Set(modules.map((m: any) => m.id));

      // Delete modules that are no longer present
      const modulesToDelete = currentModules.filter(m => !incomingModuleIds.has(m.id));
      if (modulesToDelete.length > 0) {
        await tx.module.deleteMany({ where: { id: { in: modulesToDelete.map(m => m.id) } } });
      }

      for (const [moduleIndex, module] of modules.entries()) {
        const moduleUpsertData = { title: module.title, order: moduleIndex };
        const savedModule = await tx.module.upsert({
          where: { id: module.id.startsWith("new-") ? "" : module.id },
          create: { ...moduleUpsertData, courseId },
          update: moduleUpsertData,
        });

        const currentLessons = currentModules.find(m => m.id === module.id)?.lessons || [];
        const incomingLessonIds = new Set(module.lessons.map((l: any) => l.id));

        // Delete lessons no longer present in the module
        const lessonsToDelete = currentLessons.filter(l => !incomingLessonIds.has(l.id));
        if (lessonsToDelete.length > 0) {
          await tx.lesson.deleteMany({ where: { id: { in: lessonsToDelete.map(l => l.id) } } });
        }

        for (const [lessonIndex, lesson] of module.lessons.entries()) {
          const lessonUpsertData = { title: lesson.title, order: lessonIndex, moduleId: savedModule.id };
          const savedLesson = await tx.lesson.upsert({
            where: { id: lesson.id.startsWith("new-") ? "" : lesson.id },
            create: lessonUpsertData,
            update: lessonUpsertData,
          });

          const currentBlocks = currentLessons.find(l => l.id === lesson.id)?.contentBlocks || [];
          const incomingBlockIds = new Set(lesson.contentBlocks.map((b: any) => b.id));

          // Delete blocks no longer present
          const blocksToDelete = currentBlocks.filter(b => !incomingBlockIds.has(b.id));
          if (blocksToDelete.length > 0) {
            await tx.contentBlock.deleteMany({ where: { id: { in: blocksToDelete.map(b => b.id) } } });
          }

          for (const [blockIndex, block] of lesson.contentBlocks.entries()) {
            const blockUpsertData = {
              type: block.type,
              content: block.content,
              order: blockIndex,
              lessonId: savedLesson.id
            };
            const savedBlock = await tx.contentBlock.upsert({
              where: { id: block.id.startsWith("new-") ? "" : block.id },
              create: blockUpsertData,
              update: blockUpsertData
            });

            // Handle Quiz data if the block is a QUIZ type
            if (block.type === 'QUIZ' && block.quiz) {
              const quizData = {
                title: block.quiz.title,
                description: block.quiz.description || null,
                contentBlockId: savedBlock.id,
              };
              const savedQuiz = await tx.quiz.upsert({
                where: { id: block.quiz.id.startsWith("new-") ? "" : block.quiz.id },
                create: quizData,
                update: quizData,
              });

              const currentQuestions = await tx.question.findMany({ where: { quizId: savedQuiz.id }});
              const incomingQuestionIds = new Set(block.quiz.questions.map((q: any) => q.id));
              
              const questionsToDelete = currentQuestions.filter(q => !incomingQuestionIds.has(q.id));
              if (questionsToDelete.length > 0) {
                  await tx.question.deleteMany({ where: { id: { in: questionsToDelete.map(q => q.id) } } });
              }

              for (const [qIndex, question] of block.quiz.questions.entries()) {
                const questionUpsertData = { text: question.text, type: question.type, order: qIndex, quizId: savedQuiz.id };
                const savedQuestion = await tx.question.upsert({
                  where: { id: question.id.startsWith("temp-") ? "" : question.id },
                  create: questionUpsertData,
                  update: questionUpsertData,
                });
                
                const currentOptions = await tx.answerOption.findMany({ where: { questionId: savedQuestion.id } });
                const incomingOptionIds = new Set(question.options.map((o: any) => o.id));

                const optionsToDelete = currentOptions.filter(o => !incomingOptionIds.has(o.id));
                if (optionsToDelete.length > 0) {
                    await tx.answerOption.deleteMany({ where: { id: { in: optionsToDelete.map(o => o.id) } } });
                }

                for (const option of question.options) {
                  const optionUpsertData = { text: option.text, isCorrect: option.isCorrect, feedback: option.feedback, questionId: savedQuestion.id };
                  await tx.answerOption.upsert({
                    where: { id: option.id.startsWith("temp-") ? "" : option.id },
                    create: optionUpsertData,
                    update: optionUpsertData,
                  });
                }
              }
            }
          }
        }
      }
    });

    const finalCourseState = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                contentBlocks: {
                  orderBy: { order: "asc" },
                  include: { quiz: { include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { id: "asc" } } } } } } }
                }
              }
            }
          }
        }
      },
    });

    return NextResponse.json(finalCourseState);
  } catch (error) {
    console.error(`[UPDATE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json(
      { message: "Error al actualizar el curso" },
      { status: 500 }
    );
  }
}


// DELETE course by ID
export async function DELETE(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (
    !session ||
    (session.role !== "ADMINISTRATOR" && session.role !== "INSTRUCTOR")
  ) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id: courseId } = context.params;

  try {
    const courseToDelete = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!courseToDelete) {
      return NextResponse.json(
        { message: "Curso no encontrado" },
        { status: 404 }
      );
    }

    if (
      session.role === "INSTRUCTOR" &&
      courseToDelete.instructorId !== session.id
    ) {
      return NextResponse.json(
        { message: "No tienes permiso para eliminar este curso" },
        { status: 403 }
      );
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json(
      { message: "Error al eliminar el curso" },
      { status: 500 }
    );
  }
}
