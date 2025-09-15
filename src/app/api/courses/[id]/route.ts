// src/app/api/courses/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Course as AppCourse, Module as AppModule, Lesson as AppLesson, ContentBlock, Quiz as AppQuiz, Question as AppQuestion, AnswerOption as AppAnswerOption } from '@/types';
import { checkCourseOwnership } from "@/lib/auth-utils";

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
            },
        });
        
        const existingModules = await tx.module.findMany({ where: { courseId }, select: { id: true } });
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

            const lessonsToDelete = existingLessons.filter(l => !incomingLessonIds.has(l.id));
            if (lessonsToDelete.length > 0) await tx.lesson.deleteMany({ where: { id: { in: lessonsToDelete.map(l => l.id) } }});

            for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
                const isNewLesson = lessonData.id.startsWith('new-');
                const savedLesson = await tx.lesson.upsert({
                    where: { id: isNewLesson ? `__NEVER_FIND__${lessonData.id}` : lessonData.id },
                    create: { title: lessonData.title, order: lessonIndex, moduleId: savedModule.id },
                    update: { title: lessonData.title, order: lessonIndex },
                });
                
                const existingBlocks = await tx.contentBlock.findMany({ where: { lessonId: savedLesson.id }, select: { id: true }});
                const incomingBlockIds = new Set(lessonData.contentBlocks.map(b => !b.id.startsWith('new-') ? b.id : undefined).filter(Boolean));
                
                 const blocksToDelete = existingBlocks.filter(b => !incomingBlockIds.has(b.id));
                 if (blocksToDelete.length > 0) await tx.contentBlock.deleteMany({ where: { id: { in: blocksToDelete.map(b => b.id) } }});

                for (const [blockIndex, blockData] of lessonData.contentBlocks.entries()) {
                    const isNewBlock = blockData.id.startsWith('new-');
                    const savedBlock = await tx.contentBlock.upsert({
                        where: { id: isNewBlock ? `__NEVER_FIND__${blockData.id}` : blockData.id },
                        create: { type: blockData.type, content: blockData.content || '', order: blockIndex, lessonId: savedLesson.id },
                        update: { type: blockData.type, content: blockData.content || '', order: blockIndex },
                    });

                    if (blockData.type === 'QUIZ' && blockData.quiz) {
                        const isNewQuiz = blockData.quiz.id.startsWith('new-');
                        const savedQuiz = await tx.quiz.upsert({
                             where: { id: isNewQuiz ? `__NEVER_FIND__${blockData.quiz.id}` : blockData.quiz.id },
                             create: { title: blockData.quiz.title, description: blockData.quiz.description || '', contentBlockId: savedBlock.id },
                             update: { title: blockData.quiz.title, description: blockData.quiz.description || '' },
                        });
                        
                        const existingQuestions = await tx.question.findMany({where: { quizId: savedQuiz.id }, select: { id: true }});
                        const incomingQuestionIds = new Set(blockData.quiz.questions.map(q => !q.id.startsWith('new-') ? q.id : undefined).filter(Boolean));
                        const questionsToDelete = existingQuestions.filter(q => !incomingQuestionIds.has(q.id));
                        if(questionsToDelete.length > 0) await tx.question.deleteMany({where: {id: {in: questionsToDelete.map(q=>q.id)}}});

                        for(const [qIndex, questionData] of blockData.quiz.questions.entries()){
                            const isNewQuestion = questionData.id.startsWith('new-');
                            const savedQuestion = await tx.question.upsert({
                                where: { id: isNewQuestion ? `__NEVER_FIND__${questionData.id}` : questionData.id },
                                create: { text: questionData.text, order: qIndex, quizId: savedQuiz.id },
                                update: { text: questionData.text, order: qIndex },
                            });

                            const existingOptions = await tx.answerOption.findMany({where: {questionId: savedQuestion.id}, select: {id: true}});
                            const incomingOptionIds = new Set(questionData.options.map(o => !o.id.startsWith('new-') ? o.id : undefined).filter(Boolean));
                            const optionsToDelete = existingOptions.filter(o => !incomingOptionIds.has(o.id));
                            if(optionsToDelete.length > 0) await tx.answerOption.deleteMany({where: {id: {in: optionsToDelete.map(o=>o.id)}}});

                            for(const optionData of questionData.options){
                                const isNewOption = optionData.id.startsWith('new-');
                                await tx.answerOption.upsert({
                                    where: {id: isNewOption ? `__NEVER_FIND__${optionData.id}` : optionData.id},
                                    create: { text: optionData.text, isCorrect: optionData.isCorrect, feedback: optionData.feedback, questionId: savedQuestion.id },
                                    update: { text: optionData.text, isCorrect: optionData.isCorrect, feedback: optionData.feedback },
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
            instructor: { select: { id: true, name: true } },
            modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, include: { contentBlocks: { orderBy: { order: "asc" }, include: { quiz: { include: { questions: { orderBy: { order: "asc" }, include: { options: { orderBy: { id: "asc" } } } } } } } } } } } }
        },
    });

    return NextResponse.json(finalCourseState);
  } catch (error) {
    console.error(`[UPDATE_COURSE_ID: ${courseId}]`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: "Error de guardado: Uno de los elementos a actualizar no fue encontrado." }, { status: 404 });
    }
    return NextResponse.json({ message: "Error al actualizar el curso" }, { status: 500 });
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
    await prisma.course.delete({ where: { id: courseId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[DELETE_COURSE_ID: ${courseId}]`, error);
    return NextResponse.json({ message: "Error al eliminar el curso" }, { status: 500 });
  }
}
