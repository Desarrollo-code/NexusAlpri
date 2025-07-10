
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// GET a specific course by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const course = await prisma.course.findUnique({
      where: { id },
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
                               orderBy: { id: 'asc' }, // Consistent ordering
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
  const session = await getSession(req);
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { id } = params;

  try {
    const courseData = await req.json();
    const { title, description, imageUrl, category, status, publicationDate, modules } = courseData;

    // Basic validation
    if (!title || !description) {
        return NextResponse.json({ message: 'Título y descripción son requeridos' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    // Authorization check: Only admin or the course instructor can edit
    if (session.role !== 'ADMINISTRATOR' && course.instructorId !== session.id) {
        return NextResponse.json({ message: 'No tienes permiso para editar este curso' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update course basic details
      await tx.course.update({
        where: { id },
        data: {
          title,
          description,
          imageUrl,
          category,
          status,
          publicationDate: publicationDate ? new Date(publicationDate) : null,
        },
      });

      // 2. Handle modules and lessons
      if (modules) {
        const incomingModuleIds = modules.filter((m: any) => !m._toBeDeleted && m.id && !m.id.startsWith('new-')).map((m: any) => m.id);
        
        await tx.module.deleteMany({
          where: {
            courseId: id,
            NOT: { id: { in: incomingModuleIds } },
          },
        });

        for (const [moduleIndex, moduleData] of modules.entries()) {
          if (moduleData._toBeDeleted) {
              if (!moduleData.id.startsWith('new-')) {
                  await tx.module.delete({ where: { id: moduleData.id } }).catch(() => {});
              }
              continue;
          }

          const modulePayload = {
            title: moduleData.title,
            order: moduleIndex,
            courseId: id,
          };

          const savedModule = await tx.module.upsert({
              where: { id: moduleData.id.startsWith('new-') ? '---' : moduleData.id },
              create: modulePayload,
              update: modulePayload,
          });

          // Handle lessons within the module
          if (moduleData.lessons && moduleData.lessons.length > 0) {
              const incomingLessonIds = moduleData.lessons.filter((l: any) => !l._toBeDeleted && l.id && !l.id.startsWith('new-')).map((l: any) => l.id);
              await tx.lesson.deleteMany({
                  where: {
                      moduleId: savedModule.id,
                      NOT: { id: { in: incomingLessonIds } },
                  }
              });

              for (const [lessonIndex, lessonData] of moduleData.lessons.entries()) {
                   if (lessonData._toBeDeleted) {
                      if (!lessonData.id.startsWith('new-')) {
                         await tx.lesson.delete({ where: { id: lessonData.id } }).catch(() => {});
                      }
                      continue;
                   }
                  
                  const savedLesson = await tx.lesson.upsert({
                      where: { id: lessonData.id.startsWith('new-') ? '---' : lessonData.id },
                      create: {
                        title: lessonData.title,
                        order: lessonIndex,
                        moduleId: savedModule.id,
                      },
                      update: { 
                        title: lessonData.title, 
                        order: lessonIndex,
                      },
                  });

                  // Handle Content Blocks
                  if (lessonData.contentBlocks) {
                    const incomingBlockIds = lessonData.contentBlocks.map((b:any) => b.id).filter((id:string) => !id.startsWith('new-'));
                    await tx.contentBlock.deleteMany({
                        where: { lessonId: savedLesson.id, NOT: { id: { in: incomingBlockIds } } }
                    });

                    for (const [blockIndex, blockData] of lessonData.contentBlocks.entries()) {
                        const blockPayload = {
                            type: blockData.type,
                            content: blockData.content,
                            order: blockIndex,
                            lessonId: savedLesson.id,
                        };

                        const savedBlock = await tx.contentBlock.upsert({
                            where: { id: blockData.id.startsWith('new-') ? '---' : blockData.id },
                            create: blockPayload,
                            update: blockPayload,
                        });

                        // Handle Quiz within a block
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
                            // Handle Questions & Options
                            if (quizData.questions) {
                                const incomingQuestionIds = quizData.questions.map((q: any) => q.id).filter((id: string) => !id.startsWith('temp-q'));
                                await tx.question.deleteMany({
                                    where: { quizId: savedQuiz.id, NOT: { id: { in: incomingQuestionIds } } },
                                });
                                for (const [qIndex, qData] of quizData.questions.entries()) {
                                    const questionPayload = {
                                        text: qData.text,
                                        type: 'MULTIPLE_CHOICE',
                                        order: qIndex,
                                        quizId: savedQuiz.id,
                                    };
                                    const savedQuestion = await tx.question.upsert({
                                        where: { id: qData.id.startsWith('temp-q') ? '---' : qData.id },
                                        create: questionPayload,
                                        update: { text: qData.text, order: qIndex },
                                    });
                                    if (qData.options) {
                                        const incomingOptionIds = qData.options.map((o: any) => o.id).filter((id: string) => !id.startsWith('temp-o'));
                                        await tx.answerOption.deleteMany({
                                            where: { questionId: savedQuestion.id, NOT: { id: { in: incomingOptionIds } } },
                                        });
                                        for (const oData of qData.options) {
                                            const optionPayload = {
                                                text: oData.text,
                                                isCorrect: oData.isCorrect,
                                                feedback: oData.feedback,
                                                questionId: savedQuestion.id,
                                            };
                                            await tx.answerOption.upsert({
                                                where: { id: oData.id.startsWith('temp-o') ? '---' : oData.id },
                                                create: optionPayload,
                                                update: optionPayload,
                                            });
                                        }
                                    }
                                }
                            }
                        } else {
                            // If block is not a quiz, ensure no quiz is associated
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
        where: { id },
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
    const session = await getSession(req);
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    try {
        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
        }
        if (session.role !== 'ADMINISTRATOR' && course.instructorId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para eliminar este curso' }, { status: 403 });
        }
        
        await prisma.course.delete({ where: { id } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[COURSE_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el curso' }, { status: 500 });
    }
}
