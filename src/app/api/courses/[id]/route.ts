
<<<<<<< HEAD
=======

>>>>>>> 0230902f12a6c80dc59b32fe16fc94d39570bb10
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
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const courseId = params.id;

  try {
    const courseData = await req.json();
    const { title, description, imageUrl, category, status, publicationDate, modules } = courseData;

    // Basic validation
    if (!title || !description) {
        return NextResponse.json({ message: 'Título y descripción son requeridos' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
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

      // 2. Handle modules and lessons
      if (modules) {
        const incomingModuleIds = modules.filter((m: any) => !m._toBeDeleted && m.id && !m.id.startsWith('new-')).map((m: any) => m.id);
        
        await tx.module.deleteMany({
          where: {
            courseId: courseId,
            NOT: { id: { in: incomingModuleIds } },
          },
        });

        for (const [moduleIndex, moduleData] of modules.entries()) {
          if (moduleData._toBeDeleted) {
              if (moduleData.id && !moduleData.id.startsWith('new-')) {
                  await tx.module.delete({ where: { id: moduleData.id } }).catch(() => {});
              }
              continue;
          }

          const modulePayload = {
            title: moduleData.title,
            order: moduleIndex,
            courseId: courseId,
          };

          const savedModule = await tx.module.upsert({
              where: { id: moduleData.id && !moduleData.id.startsWith('new-') ? moduleData.id : '---' }, // Dummy where for creation
              create: { ...modulePayload, id: moduleData.id && moduleData.id.startsWith('new-') ? undefined : moduleData.id },
              update: modulePayload,
          });

<<<<<<< HEAD
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
=======
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
                      if (lessonData.id && !lessonData.id.startsWith('new-')) {
                         await tx.lesson.delete({ where: { id: lessonData.id } }).catch(() => {});
                      }
                      continue;
                   }
                  
                  const savedLesson = await tx.lesson.upsert({
                      where: { id: lessonData.id && !lessonData.id.startsWith('new-') ? lessonData.id : '---' },
                      create: {
                        id: lessonData.id && lessonData.id.startsWith('new-') ? undefined : lessonData.id,
                        title: lessonData.title,
                        order: lessonIndex,
                        moduleId: savedModule.id,
                      },
                      update: { 
                        title: lessonData.title, 
                        order: lessonIndex,
                      },
                  });
>>>>>>> 0230902f12a6c80dc59b32fe16fc94d39570bb10
                
                  // New logic: Apply template if provided
                  if (lessonData.templateId) {
                      const template = await tx.lessonTemplate.findUnique({
                          where: { id: lessonData.templateId },
                          include: { templateBlocks: { orderBy: { order: 'asc' } } }
                      });
                      if (template) {
                          // Delete existing blocks and create new ones from template
                          await tx.contentBlock.deleteMany({ where: { lessonId: savedLesson.id } });
                          await tx.contentBlock.createMany({
                              data: template.templateBlocks.map(tb => ({
                                  type: tb.type,
                                  order: tb.order,
                                  lessonId: savedLesson.id,
                                  content: '', // Placeholders are empty
                              }))
                          });
                      }
                  } else if (lessonData.contentBlocks) { // Existing logic for content blocks
                    const incomingBlockIds = lessonData.contentBlocks.filter((b: any) => !b._toBeDeleted && b.id && !b.id.startsWith('new-')).map((b: any) => b.id);
                    await tx.contentBlock.deleteMany({
                        where: { lessonId: savedLesson.id, NOT: { id: { in: incomingBlockIds } } }
                    });

                    for (const [blockIndex, blockData] of lessonData.contentBlocks.entries()) {
                        if (blockData._toBeDeleted) {
                           if (blockData.id && !blockData.id.startsWith('new-')) {
                               await tx.contentBlock.delete({ where: { id: blockData.id } }).catch(() => {});
                           }
                           continue;
                        }
                        const blockPayload = {
                            type: blockData.type,
                            content: blockData.content,
                            order: blockIndex,
                            lessonId: savedLesson.id,
                        };

                        const savedBlock = await tx.contentBlock.upsert({
                            where: { id: blockData.id && !blockData.id.startsWith('new-') ? blockData.id : '---' },
                            create: { ...blockPayload, id: blockData.id && blockData.id.startsWith('new-') ? undefined : blockData.id },
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
                                        create: { ...questionPayload, id: qData.id.startsWith('temp-q') ? undefined : qData.id },
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
                                                create: { ...optionPayload, id: oData.id.startsWith('temp-o') ? undefined : oData.id },
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
        
        // Use a transaction to delete notifications and the course together
        await prisma.$transaction(async (tx) => {
            // Delete notifications related to this course
            await tx.notification.deleteMany({
                where: {
                    link: `/courses/${courseId}`
                }
            });

            // Delete the course itself
            await tx.course.delete({ where: { id: courseId } });
        });


        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[COURSE_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el curso' }, { status: 500 });
    }
}
    
