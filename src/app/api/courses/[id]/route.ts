// src/app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, ContentBlock, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption } from '@/types';


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
    
    // De-structure course data from the rest of the nested structure
    const { modules, ...courseData } = body;
    
    await prisma.$transaction(async (tx) => {
        // 1. Update basic course data
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

        // Get current modules and lessons from DB for comparison
        const currentModules = await tx.module.findMany({ where: { courseId }, select: { id: true, lessons: { select: { id: true, contentBlocks: { select: { id: true, quiz: { select: { id: true } } } } } } } } });
        const incomingModuleIds = new Set(modules.filter(m => !m.id.startsWith('new-')).map(m => m.id));
        const modulesToDelete = currentModules.filter(m => !incomingModuleIds.has(m.id));

        // Delete modules that are no longer present
        for (const moduleToDelete of modulesToDelete) {
            await tx.module.delete({ where: { id: moduleToDelete.id } });
        }
        
        // Upsert Modules
        for (const [moduleIndex, moduleData] of modules.entries()) {
            const isNewModule = moduleData.id.startsWith('new-');
            const savedModule = await tx.module.upsert({
                where: { id: isNewModule ? `_nonexistent_${moduleData.id}` : moduleData.id },
                create: { title: moduleData.title, order: moduleIndex, courseId },
                update: { title: moduleData.title, order: moduleIndex },
            });

            // Handle lessons for the current module
            const currentLessonsInModule = currentModules.find(m => m.id === savedModule.id)?.lessons || [];
            const incomingLessonIds = new Set(moduleData.lessons.filter(l => !l.id.startsWith('new-')).map(l => l.id));
            const lessonsToDelete = currentLessonsInModule.filter(l => !incomingLessonIds.has(l.id));

            for (const lessonToDelete of lessonsToDelete) {
                 await tx.lesson.delete({ where: { id: lessonToDelete.id } });
            }

            // Upsert Lessons
            for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
                const isNewLesson = lessonData.id.startsWith('new-');
                const savedLesson = await tx.lesson.upsert({
                    where: { id: isNewLesson ? `_nonexistent_lesson_${lessonData.id}` : lessonData.id },
                    create: { title: lessonData.title, order: lessonIndex, moduleId: savedModule.id },
                    update: { title: lessonData.title, order: lessonIndex },
                });

                // Handle Content Blocks
                const currentBlocksInLesson = currentLessonsInModule.find(l => l.id === savedLesson.id)?.contentBlocks || [];
                const incomingBlockIds = new Set(lessonData.contentBlocks.filter(b => !b.id.startsWith('new-')).map(b => b.id));
                const blocksToDelete = currentBlocksInLesson.filter(b => !incomingBlockIds.has(b.id));

                for (const blockToDelete of blocksToDelete) {
                    await tx.contentBlock.delete({ where: { id: blockToDelete.id } });
                }
                
                // Upsert Content Blocks
                for (const [blockIndex, blockData] of lessonData.contentBlocks.entries()) {
                    const isNewBlock = blockData.id.startsWith('new-');
                    const savedBlock = await tx.contentBlock.upsert({
                        where: { id: isNewBlock ? `_nonexistent_block_${blockData.id}` : blockData.id },
                        create: { type: blockData.type, content: blockData.content || '', order: blockIndex, lessonId: savedLesson.id },
                        update: { type: blockData.type, content: blockData.content || '', order: blockIndex },
                    });

                    // Handle Quizzes
                    if (blockData.type === 'QUIZ' && blockData.quiz) {
                        const isNewQuiz = blockData.quiz.id.startsWith('new-');
                        const quizData = { title: blockData.quiz.title, description: blockData.quiz.description || '', contentBlockId: savedBlock.id };
                        const savedQuiz = await tx.quiz.upsert({
                             where: { id: isNewQuiz ? `_nonexistent_quiz_${blockData.quiz.id}` : blockData.quiz.id },
                             create: quizData,
                             update: quizData,
                        });

                        // Upsert questions and options
                        const currentQuestions = await tx.question.findMany({ where: { quizId: savedQuiz.id }, include: { options: true } });
                        const incomingQuestionIds = new Set(blockData.quiz.questions.filter(q => !q.id.startsWith('temp-q-')).map(q => q.id));
                        
                        const questionsToDelete = currentQuestions.filter(q => !incomingQuestionIds.has(q.id));
                        for(const qToDelete of questionsToDelete) {
                            await tx.question.delete({ where: { id: qToDelete.id } });
                        }
                        
                        for (const [qIndex, questionData] of blockData.quiz.questions.entries()) {
                            const isNewQuestion = questionData.id.startsWith('temp-q-');
                            const savedQuestion = await tx.question.upsert({
                                where: { id: isNewQuestion ? `_nonexistent_question_${questionData.id}` : questionData.id },
                                create: { text: questionData.text, type: 'MULTIPLE_CHOICE', order: qIndex, quizId: savedQuiz.id },
                                update: { text: questionData.text, order: qIndex },
                            });

                            const currentOptions = currentQuestions.find(q => q.id === savedQuestion.id)?.options || [];
                            const incomingOptionIds = new Set(questionData.options.filter(o => !o.id.startsWith('temp-o-')).map(o => o.id));
                            const optionsToDelete = currentOptions.filter(o => !incomingOptionIds.has(o.id));
                            for(const oToDelete of optionsToDelete) {
                                await tx.answerOption.delete({ where: { id: oToDelete.id }});
                            }
                            
                            for (const optionData of questionData.options) {
                                const isNewOption = optionData.id.startsWith('temp-o-');
                                await tx.answerOption.upsert({
                                    where: { id: isNewOption ? `_nonexistent_option_${optionData.id}` : optionData.id },
                                    create: { text: optionData.text, isCorrect: optionData.isCorrect, feedback: optionData.feedback, questionId: savedQuestion.id },
                                    update: { text: optionData.text, isCorrect: optionData.isCorrect, feedback: optionData.feedback },
                                });
                            }
                        }
                    } else {
                        // If block is not a quiz, delete any quiz associated with it
                        const existingQuiz = currentBlocksInLesson.find(b => b.id === savedBlock.id)?.quiz;
                        if(existingQuiz) {
                            await tx.quiz.delete({ where: { id: existingQuiz.id }});
                        }
                    }
                }
            }
        }
    });


    // Refetch the full course state to return to client
    const finalCourseState = await prisma.course.findUnique({
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

    return NextResponse.json(finalCourseState);
  } catch (error) {
    console.error(`[UPDATE_COURSE_ID: ${courseId}]`, error);
    // Be more specific about the error if possible
    if (error instanceof prisma.Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return NextResponse.json({ message: "Error de guardado: Uno de los elementos a actualizar no fue encontrado." }, { status: 404 });
        }
    }
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
