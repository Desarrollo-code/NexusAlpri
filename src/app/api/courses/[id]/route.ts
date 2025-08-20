
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

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
                              orderBy: { id: 'asc' },
                            }
                          },
                        },
                      },
                    },
                  }
                }
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
    console.error('[COURSE_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener el curso' }, { status: 500 });
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
    const courseData = await req.json();
    const { title, description, imageUrl, category, status, publicationDate, modules } = courseData;

    if (!title || !description) {
      return NextResponse.json({ message: 'Título y descripción son requeridos' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMINISTRATOR' && course.instructorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para editar este curso' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update course basic details
      await tx.course.update({
        where: { id: courseId },
        data: {
          title,
          description,
          imageUrl,
          category,
          status,
          publicationDate: publicationDate ? new Date(publicationDate) : null,
        },
      });

      // 2. Handle modules, lessons, content blocks, and quizzes
      if (modules) {
        const incomingModuleIds = modules.filter((m: any) => !m._toBeDeleted).map((m: any) => m.id).filter((id: string) => !id.startsWith('new-'));
        
        await tx.module.deleteMany({
          where: {
            courseId: courseId,
            id: { notIn: incomingModuleIds },
          },
        });

        for (const [moduleIndex, moduleData] of modules.entries()) {
          if (moduleData._toBeDeleted) {
            continue;
          }

          const isNewModule = moduleData.id?.startsWith('new-');
          const modulePayload = {
            title: moduleData.title,
            order: moduleIndex,
            courseId: courseId,
          };
          
          let savedModule;
          if (isNewModule) {
            savedModule = await tx.module.create({ data: modulePayload });
          } else {
            savedModule = await tx.module.update({
              where: { id: moduleData.id },
              data: modulePayload,
            });
          }

          if (moduleData.lessons) {
            const incomingLessonIds = moduleData.lessons.filter((l: any) => !l._toBeDeleted).map((l: any) => l.id).filter((id: string) => !id.startsWith('new-'));
            
            await tx.lesson.deleteMany({
              where: {
                moduleId: savedModule.id,
                id: { notIn: incomingLessonIds },
              }
            });

            for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
              if (lessonData._toBeDeleted) {
                continue;
              }
              
              const isNewLesson = lessonData.id?.startsWith('new-');
              let savedLesson;
              
              const lessonPayload = {
                title: lessonData.title,
                order: lessonIndex,
                moduleId: savedModule.id,
              }
              
              if (isNewLesson) {
                savedLesson = await tx.lesson.create({ data: lessonPayload });
              } else {
                savedLesson = await tx.lesson.update({
                  where: { id: lessonData.id },
                  data: lessonPayload,
                });
              }
            
              if (lessonData.templateId && !lessonData.contentBlocks?.length) { // Apply template only if no blocks exist
                const template = await tx.lessonTemplate.findUnique({
                    where: { id: lessonData.templateId },
                    include: { templateBlocks: { orderBy: { order: 'asc' } } }
                });
                if (template) {
                    await tx.contentBlock.deleteMany({ where: { lessonId: savedLesson.id } });
                    const blocksData = template.templateBlocks.map(tb => ({
                        type: tb.type,
                        order: tb.order,
                        lessonId: savedLesson.id,
                        content: '',
                    }));
                    await tx.contentBlock.createMany({ data: blocksData });
                }
              } else if (lessonData.contentBlocks) {
                const incomingBlockIds = lessonData.contentBlocks.filter((b: any) => !b._toBeDeleted).map((b: any) => b.id).filter((id: string) => !id.startsWith('new-'));
                
                await tx.contentBlock.deleteMany({
                    where: { lessonId: savedLesson.id, id: { notIn: incomingBlockIds } }
                });

                for (const [blockIndex, blockData] of lessonData.contentBlocks.entries()) {
                    if (blockData._toBeDeleted) {
                        continue;
                    }
                    const isNewBlock = blockData.id?.startsWith('new-');
                    const blockPayload = {
                        type: blockData.type,
                        content: blockData.content,
                        order: blockIndex,
                        lessonId: savedLesson.id,
                    };
                    
                    let savedBlock;
                    if (isNewBlock) {
                        savedBlock = await tx.contentBlock.create({ data: blockPayload });
                    } else {
                        savedBlock = await tx.contentBlock.update({
                            where: { id: blockData.id },
                            data: blockPayload,
                        });
                    }

                    if (blockData.type === 'QUIZ' && blockData.quiz) {
                        const quizData = blockData.quiz;
                        const quizPayload = {
                            title: quizData.title,
                            description: quizData.description,
                            contentBlockId: savedBlock.id,
                        };
                        const savedQuiz = await tx.quiz.upsert({
                            where: { contentBlockId: savedBlock.id },
                            create: quizPayload,
                            update: quizPayload,
                        });
                        
                        if (quizData.questions) {
                            const incomingQuestionIds = quizData.questions.filter((q: any) => !q._toBeDeleted).map((q: any) => q.id).filter((id: string) => !id.startsWith('new-'));
                            await tx.question.deleteMany({
                                where: { quizId: savedQuiz.id, id: { notIn: incomingQuestionIds } },
                            });
                            
                            for (const [qIndex, qData] of quizData.questions.entries()) {
                                if (qData._toBeDeleted) continue;
                                const isNewQuestion = qData.id?.startsWith('new-');
                                const questionPayload = {
                                    text: qData.text,
                                    type: 'MULTIPLE_CHOICE',
                                    order: qIndex,
                                    quizId: savedQuiz.id,
                                };
                                let savedQuestion;
                                if (isNewQuestion) {
                                    savedQuestion = await tx.question.create({ data: questionPayload });
                                } else {
                                    savedQuestion = await tx.question.update({
                                        where: { id: qData.id },
                                        data: questionPayload,
                                    });
                                }
                                
                                if (qData.options) {
                                    const incomingOptionIds = qData.options.filter((o: any) => !o._toBeDeleted).map((o: any) => o.id).filter((id: string) => !id.startsWith('new-'));
                                    await tx.answerOption.deleteMany({
                                        where: { questionId: savedQuestion.id, id: { notIn: incomingOptionIds } },
                                    });
                                    
                                    for (const oData of qData.options) {
                                        if (oData._toBeDeleted) continue;
                                        const isNewOption = oData.id?.startsWith('new-');
                                        const optionPayload = {
                                            text: oData.text,
                                            isCorrect: oData.isCorrect,
                                            feedback: oData.feedback,
                                            questionId: savedQuestion.id,
                                        };
                                        if (isNewOption) {
                                            await tx.answerOption.create({ data: optionPayload });
                                        } else {
                                            await tx.answerOption.update({
                                                where: { id: oData.id },
                                                data: optionPayload,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        await tx.quiz.deleteMany({ where: { contentBlockId: savedBlock.id }});
                    }
                }
              }
            }
          }
        }
      }
    });
    
    // Fetch the fully populated course to return to the client
    const finalCourse = await prisma.course.findUnique({
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
                          include: { options: { orderBy: { id: 'asc' } } },
                        },
                      },
                    },
                  }
                }
              },
            },
          },
        },
      },
    });

    return NextResponse.json(finalCourse);

  } catch (error) {
    console.error('[COURSE_PUT_ERROR]', error);
    return NextResponse.json({ message: 'Error al actualizar el curso' }, { status: 500 });
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
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }
    if (session.role !== 'ADMINISTRATOR' && course.instructorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para eliminar este curso' }, { status: 403 });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({
        where: {
          link: `/courses/${courseId}`
        }
      });
      await tx.course.delete({ where: { id: courseId } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[COURSE_DELETE_ERROR]', error);
    return NextResponse.json({ message: 'Error al eliminar el curso' }, { status: 500 });
  }
}
