// src/app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET a specific course by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = params.id;
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
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const courseId = params.id;

  try {
    const body = await req.json();

    const courseToUpdate = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, modules: { include: { lessons: { include: { contentBlocks: { include: { quiz: true } } } } } } },
    });

    if (!courseToUpdate) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    if (session.role !== "ADMINISTRATOR" && courseToUpdate.instructorId !== session.id) {
      return NextResponse.json({ message: "No tienes permiso para actualizar este curso" }, { status: 403 });
    }

    const { modules: incomingModules, ...courseData } = body;

    await prisma.$transaction(async (tx) => {
      // 1. Update basic course data
      await tx.course.update({
        where: { id: courseId },
        data: {
          ...courseData,
          publicationDate: courseData.publicationDate ? new Date(courseData.publicationDate) : null,
        },
      });

      const currentModuleIds = new Set(courseToUpdate.modules.map(m => m.id));
      const incomingModuleIds = new Set(incomingModules.map((m: any) => m.id));

      const moduleIdsToDelete = [...currentModuleIds].filter(id => !incomingModuleIds.has(id));
      if (moduleIdsToDelete.length > 0) {
        await tx.module.deleteMany({ where: { id: { in: moduleIdsToDelete } } });
      }

      for (const [moduleIndex, module] of incomingModules.entries()) {
        const moduleUpsertData = { title: module.title, order: moduleIndex, courseId };
        
        const isNewModule = module.id.startsWith('new-');
        const savedModule = await tx.module.upsert({
          where: { id: isNewModule ? '' : module.id },
          create: moduleUpsertData,
          update: moduleUpsertData,
        });
        
        const currentLessons = courseToUpdate.modules.find(m => m.id === (isNewModule ? savedModule.id : module.id))?.lessons || [];
        const currentLessonIds = new Set(currentLessons.map(l => l.id));
        const incomingLessonIds = new Set(module.lessons.map((l: any) => l.id));
        
        const lessonIdsToDelete = [...currentLessonIds].filter(id => !incomingLessonIds.has(id));
        if (lessonIdsToDelete.length > 0) {
            await tx.lesson.deleteMany({ where: { id: { in: lessonIdsToDelete } } });
        }

        for (const [lessonIndex, lesson] of module.lessons.entries()) {
          const lessonUpsertData = { title: lesson.title, order: lessonIndex, moduleId: savedModule.id };
          const isNewLesson = lesson.id.startsWith('new-');
          const savedLesson = await tx.lesson.upsert({
            where: { id: isNewLesson ? '' : lesson.id },
            create: lessonUpsertData,
            update: lessonUpsertData,
          });

          const currentBlocks = currentLessons.find(l => l.id === (isNewLesson ? savedLesson.id : lesson.id))?.contentBlocks || [];
          const currentBlockIds = new Set(currentBlocks.map(b => b.id));
          const incomingBlockIds = new Set(lesson.contentBlocks.map((b: any) => b.id));

          const blockIdsToDelete = [...currentBlockIds].filter(id => !incomingBlockIds.has(id));
           if (blockIdsToDelete.length > 0) {
                await tx.contentBlock.deleteMany({ where: { id: { in: blockIdsToDelete } } });
           }

          for (const [blockIndex, block] of lesson.contentBlocks.entries()) {
            const blockUpsertData = { type: block.type, content: block.content, order: blockIndex, lessonId: savedLesson.id };
            const isNewBlock = block.id.startsWith('new-');
            const savedBlock = await tx.contentBlock.upsert({
                where: { id: isNewBlock ? '' : block.id },
                create: blockUpsertData,
                update: blockUpsertData,
            });

            if (block.type === 'QUIZ' && block.quiz) {
                const isNewQuiz = block.quiz.id.startsWith('new-');
                const quizData = { title: block.quiz.title, description: block.quiz.description, contentBlockId: savedBlock.id };
                const savedQuiz = await tx.quiz.upsert({
                    where: { id: isNewQuiz ? '' : block.quiz.id },
                    create: quizData,
                    update: quizData,
                });
                
                const currentQuestions = await tx.question.findMany({ where: { quizId: savedQuiz.id }, include: { options: true } });
                const currentQuestionIds = new Set(currentQuestions.map(q => q.id));
                const incomingQuestionIds = new Set(block.quiz.questions.map((q: any) => q.id));
                const questionIdsToDelete = [...currentQuestionIds].filter(id => !incomingQuestionIds.has(id));
                if (questionIdsToDelete.length > 0) {
                    await tx.question.deleteMany({ where: { id: { in: questionIdsToDelete } } });
                }

                for (const [qIndex, question] of block.quiz.questions.entries()) {
                    const isNewQuestion = question.id.startsWith('temp-q-');
                    const questionUpsertData = { text: question.text, type: question.type, order: qIndex, quizId: savedQuiz.id };
                    const savedQuestion = await tx.question.upsert({
                        where: { id: isNewQuestion ? '' : question.id },
                        create: questionUpsertData,
                        update: questionUpsertData,
                    });

                    const currentOptions = currentQuestions.find(q => q.id === (isNewQuestion ? savedQuestion.id : question.id))?.options || [];
                    const currentOptionIds = new Set(currentOptions.map(o => o.id));
                    const incomingOptionIds = new Set(question.options.map((o: any) => o.id));
                    const optionIdsToDelete = [...currentOptionIds].filter(id => !incomingOptionIds.has(id));
                    if(optionIdsToDelete.length > 0) {
                        await tx.answerOption.deleteMany({ where: { id: { in: optionIdsToDelete } } });
                    }
                    
                    for (const option of question.options) {
                        const isNewOption = option.id.startsWith('temp-o-');
                        const optionUpsertData = { text: option.text, isCorrect: option.isCorrect, feedback: option.feedback, questionId: savedQuestion.id };
                        await tx.answerOption.upsert({
                            where: { id: isNewOption ? '' : option.id },
                            create: optionUpsertData,
                            update: optionUpsertData,
                        });
                    }
                }
            } else {
                 const currentBlock = currentBlocks.find(b => b.id === (isNewBlock ? savedBlock.id : block.id));
                 if (currentBlock?.quiz) {
                     await tx.quiz.delete({ where: { id: currentBlock.quiz.id }});
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (
    !session ||
    (session.role !== "ADMINISTRATOR" && session.role !== "INSTRUCTOR")
  ) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const courseId = params.id;

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
