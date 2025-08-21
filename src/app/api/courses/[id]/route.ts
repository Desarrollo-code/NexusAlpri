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
      select: { instructorId: true },
    });

    if (!courseToUpdate) {
      return NextResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    }

    if (session.role !== "ADMINISTRATOR" && courseToUpdate.instructorId !== session.id) {
      return NextResponse.json({ message: "No tienes permiso para actualizar este curso" }, { status: 403 });
    }

    const { modules: incomingModules, ...courseData } = body;
    
    // Explicitly handle modules/lessons/blocks to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // 1. Update basic course data
      await tx.course.update({
        where: { id: courseId },
        data: {
          ...courseData,
          publicationDate: courseData.publicationDate ? new Date(courseData.publicationDate) : null,
        },
      });

      const existingModules = await tx.module.findMany({ where: { courseId } });
      const incomingModuleIds = new Set(incomingModules.map((m: any) => m.id).filter((id: string) => !id.startsWith('new-')));
      
      // Delete modules that are not in the incoming data
      const moduleIdsToDelete = existingModules.filter(m => !incomingModuleIds.has(m.id)).map(m => m.id);
      if (moduleIdsToDelete.length > 0) {
        await tx.module.deleteMany({ where: { id: { in: moduleIdsToDelete } } });
      }

      // Upsert modules
      for (const [moduleIndex, module] of incomingModules.entries()) {
          const isNewModule = module.id.startsWith('new-');
          const savedModule = await tx.module.upsert({
              where: { id: isNewModule ? '' : module.id }, // Provide a dummy ID for creation
              create: { title: module.title, order: moduleIndex, courseId },
              update: { title: module.title, order: moduleIndex },
          });

          const existingLessons = await tx.lesson.findMany({ where: { moduleId: savedModule.id } });
          const incomingLessonIds = new Set(module.lessons.map((l: any) => l.id).filter((id: string) => !id.startsWith('new-')));
          
          // Delete lessons not in incoming data for this module
          const lessonIdsToDelete = existingLessons.filter(l => !incomingLessonIds.has(l.id)).map(l => l.id);
          if (lessonIdsToDelete.length > 0) {
              await tx.lesson.deleteMany({ where: { id: { in: lessonIdsToDelete } } });
          }

          // Upsert lessons
          for (const [lessonIndex, lesson] of module.lessons.entries()) {
              const isNewLesson = lesson.id.startsWith('new-');
              const savedLesson = await tx.lesson.upsert({
                  where: { id: isNewLesson ? '' : lesson.id },
                  create: { title: lesson.title, order: lessonIndex, moduleId: savedModule.id },
                  update: { title: lesson.title, order: lessonIndex },
              });
              
              // Handle content blocks
              const existingBlocks = await tx.contentBlock.findMany({ where: { lessonId: savedLesson.id }});
              const incomingBlockIds = new Set(lesson.contentBlocks.map((b: any) => b.id).filter((id: string) => !id.startsWith('new-')));

              const blockIdsToDelete = existingBlocks.filter(b => !incomingBlockIds.has(b.id)).map(b => b.id);
              if (blockIdsToDelete.length > 0) {
                  await tx.contentBlock.deleteMany({ where: { id: { in: blockIdsToDelete } } });
              }

              for (const [blockIndex, block] of lesson.contentBlocks.entries()) {
                  const isNewBlock = block.id.startsWith('new-');
                  const savedBlock = await tx.contentBlock.upsert({
                      where: { id: isNewBlock ? '' : block.id },
                      create: { type: block.type, content: block.content, order: blockIndex, lessonId: savedLesson.id },
                      update: { type: block.type, content: block.content, order: blockIndex },
                  });
                  
                  // Handle quiz within the block
                  if (block.type === 'QUIZ' && block.quiz) {
                      const isNewQuiz = block.quiz.id.startsWith('new-');
                      const quizData = { title: block.quiz.title, description: block.quiz.description, contentBlockId: savedBlock.id };
                      const savedQuiz = await tx.quiz.upsert({
                          where: { id: isNewQuiz ? '' : block.quiz.id },
                          create: quizData,
                          update: quizData,
                      });
                      
                      // Handle questions and options
                      const existingQuestions = await tx.question.findMany({ where: { quizId: savedQuiz.id } });
                      const incomingQuestionIds = new Set(block.quiz.questions.map((q: any) => q.id).filter((id: string) => !id.startsWith('temp-q-')));
                      const questionIdsToDelete = existingQuestions.filter(q => !incomingQuestionIds.has(q.id)).map(q => q.id);
                      if (questionIdsToDelete.length > 0) {
                          await tx.question.deleteMany({ where: { id: { in: questionIdsToDelete } } });
                      }
                      
                      for (const [qIndex, question] of block.quiz.questions.entries()) {
                          const isNewQuestion = question.id.startsWith('temp-q-');
                          const savedQuestion = await tx.question.upsert({
                              where: { id: isNewQuestion ? '' : question.id },
                              create: { text: question.text, type: 'MULTIPLE_CHOICE', order: qIndex, quizId: savedQuiz.id },
                              update: { text: question.text, order: qIndex },
                          });
                          
                          const existingOptions = await tx.answerOption.findMany({ where: { questionId: savedQuestion.id } });
                          const incomingOptionIds = new Set(question.options.map((o: any) => o.id).filter((id: string) => !id.startsWith('temp-o-')));
                          const optionIdsToDelete = existingOptions.filter(o => !incomingOptionIds.has(o.id)).map(o => o.id);
                          if (optionIdsToDelete.length > 0) {
                              await tx.answerOption.deleteMany({ where: { id: { in: optionIdsToDelete } } });
                          }

                          for (const option of question.options) {
                              const isNewOption = option.id.startsWith('temp-o-');
                              await tx.answerOption.upsert({
                                  where: { id: isNewOption ? '' : option.id },
                                  create: { text: option.text, isCorrect: option.isCorrect, feedback: option.feedback, questionId: savedQuestion.id },
                                  update: { text: option.text, isCorrect: option.isCorrect, feedback: option.feedback },
                              });
                          }
                      }
                  } else {
                     // If block is not a quiz, delete any existing quiz associated with it
                     const existingQuiz = await tx.quiz.findFirst({ where: { contentBlockId: savedBlock.id }});
                     if (existingQuiz) {
                         await tx.quiz.delete({ where: { id: existingQuiz.id }});
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
