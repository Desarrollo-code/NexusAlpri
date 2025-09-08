// prisma/seed.ts
import { PrismaClient, UserRole, AchievementSlug } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Conexión explícita a la base de datos para el script de seed
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const achievementsToSeed = [
  { slug: AchievementSlug.FIRST_ENROLLMENT, name: 'Primer Paso', description: 'Te has inscrito en tu primer curso.', points: 10, icon: 'Footprints' },
  { slug: AchievementSlug.FIRST_COURSE_COMPLETED, name: 'Finalista', description: 'Has completado tu primer curso.', points: 100, icon: 'GraduationCap' },
  { slug: AchievementSlug.PERFECT_QUIZ_SCORE, name: 'Perfeccionista', description: 'Obtuviste una puntuación perfecta en un quiz.', points: 50, icon: 'Target' },
  { slug: AchievementSlug.FIVE_COURSES_COMPLETED, name: 'Maratonista del Saber', description: 'Has completado cinco cursos.', points: 250, icon: 'Award' },
];

async function main() {
  console.log('Iniciando el proceso de seeding...');
  const hashedPassword = await bcrypt.hash('nexuspro', 10);

  // --- 1. CONFIGURACIÓN Y LOGROS ---
  console.log('Verificando configuración y logros...');
  await prisma.platformSettings.upsert({
      where: { id: 'cl-nexus-settings-default' },
      update: {},
      create: {
            id: 'cl-nexus-settings-default',
            platformName: "NexusAlpri", allowPublicRegistration: true, enableEmailNotifications: true, emailWhitelist: "",
            resourceCategories: "Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General",
            passwordMinLength: 8, passwordRequireUppercase: true, passwordRequireLowercase: true, passwordRequireNumber: true, passwordRequireSpecialChar: false,
            enableIdleTimeout: true, idleTimeoutMinutes: 20, require2faForAdmins: false,
            primaryColor: '#6366f1', secondaryColor: '#a5b4fc', accentColor: '#ec4899', backgroundColorLight: '#f8fafc',
            primaryColorDark: '#a5b4fc', backgroundColorDark: '#020617',
            fontHeadline: 'Space Grotesk', fontBody: 'Inter'
      }
  });

  for (const ach of achievementsToSeed) {
    await prisma.achievement.upsert({ where: { slug: ach.slug }, update: {}, create: ach });
  }
  console.log('Configuración y logros listos.');

  // --- 2. USUARIOS ---
  console.log('Creando usuarios de prueba...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexus.com' }, update: {},
    create: { email: 'admin@nexus.com', name: 'Admin Nexus', password: hashedPassword, role: UserRole.ADMINISTRATOR, isActive: true },
  });
  const instructorUser = await prisma.user.upsert({
    where: { email: 'instructor@nexus.com' }, update: {},
    create: { email: 'instructor@nexus.com', name: 'Isabela Rojas', password: hashedPassword, role: UserRole.INSTRUCTOR, isActive: true },
  });
  const studentUser1 = await prisma.user.upsert({
    where: { email: 'laura.gomez@nexus.com' }, update: {},
    create: { email: 'laura.gomez@nexus.com', name: 'Laura Gómez', password: hashedPassword, role: UserRole.STUDENT, isActive: true },
  });
  const studentUser2 = await prisma.user.upsert({
    where: { email: 'carlos.santana@nexus.com' }, update: {},
    create: { email: 'carlos.santana@nexus.com', name: 'Carlos Santana', password: hashedPassword, role: UserRole.STUDENT, isActive: true },
  });
  console.log('Usuarios creados.');

  // --- 3. CONTENIDO GLOBAL (Anuncios, Calendario, Recursos) ---
  console.log('Creando contenido global...');
  await prisma.announcement.upsert({
    where: { id: 'clseedannouncement01' }, update: {},
    create: { id: 'clseedannouncement01', title: '¡Bienvenid@ a la nueva plataforma de aprendizaje!', content: '<p>Estamos muy emocionados de lanzar esta nueva herramienta para potenciar tu desarrollo profesional.</p>', authorId: adminUser.id, audience: 'ALL', priority: 'Normal' }
  });
  await prisma.calendarEvent.upsert({
      where: { id: 'clseedevent01' }, update: {},
      create: { id: 'clseedevent01', title: 'Reunión Trimestral de Resultados', start: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 10, 0), end: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 11, 30), audienceType: 'ALL', creatorId: adminUser.id, color: 'blue', attachments: [] }
  });
  const pinHash = await bcrypt.hash('1234', 10);
  const folder = await prisma.resource.upsert({
      where: { id: 'clseedfolder01' }, update: {},
      create: { id: 'clseedfolder01', title: 'Documentos de RRHH', type: 'FOLDER', uploaderId: adminUser.id, ispublic: true }
  });
  await prisma.resource.upsert({
      where: { id: 'clseedresource01' }, update: {},
      create: { id: 'clseedresource01', title: 'Guía de Beneficios 2024', type: 'DOCUMENT', uploaderId: adminUser.id, parentId: folder.id, url: '/uploads/placeholder.pdf', pin: pinHash, ispublic: true, category: 'Recursos Humanos' }
  });
  console.log('Contenido global creado.');

  // --- 4. CURSOS ---
  console.log('Creando cursos de prueba...');
  const courseAdmin = await prisma.course.upsert({
      where: { id: 'clseedcourse01' }, update: {},
      create: { id: 'clseedcourse01', title: 'Curso de Bienvenida a NexusAlpri', description: 'Un curso rápido para conocer la plataforma.', category: 'Formación Interna', instructorId: adminUser.id, status: 'PUBLISHED' }
  });
  
  const courseInstructor = await prisma.course.upsert({
      where: { id: 'clseedcourse02' }, update: {},
      create: { id: 'clseedcourse02', title: 'Marketing Digital para Principiantes', description: 'Aprende los fundamentos del marketing digital desde cero.', category: 'Marketing', instructorId: instructorUser.id, status: 'PUBLISHED', imageUrl: '/uploads/courses/marketing_cover.jpg' },
  });

  const module1 = await prisma.module.upsert({ where: { id: 'clseedmodule01' }, update: {}, create: { id: 'clseedmodule01', title: 'Módulo 1: Introducción al Marketing', courseId: courseInstructor.id, order: 0 }});
  const lesson1_1 = await prisma.lesson.upsert({ where: { id: 'clseedlesson11'}, update: {}, create: { id: 'clseedlesson11', title: '¿Qué es el Marketing Digital?', moduleId: module1.id, order: 0 }});
  await prisma.contentBlock.upsert({ where: { id: 'clseedblock111'}, update: {}, create: { id: 'clseedblock111', type: 'TEXT', content: '<p>El marketing digital es la aplicación de las estrategias de comercialización llevadas a cabo en los medios digitales.</p>', lessonId: lesson1_1.id, order: 0 }});
  
  const lesson1_2 = await prisma.lesson.upsert({ where: { id: 'clseedlesson12'}, update: {}, create: { id: 'clseedlesson12', title: 'Video: ¿Qué es el SEO?', moduleId: module1.id, order: 1 }});
  await prisma.contentBlock.upsert({ where: { id: 'clseedblock121'}, update: {}, create: { id: 'clseedblock121', type: 'VIDEO', content: 'https://www.youtube.com/watch?v=6c5y4_DBw_g', lessonId: lesson1_2.id, order: 0 }});
  
  const module2 = await prisma.module.upsert({ where: { id: 'clseedmodule02' }, update: {}, create: { id: 'clseedmodule02', title: 'Módulo 2: Herramientas Clave', courseId: courseInstructor.id, order: 1 }});
  const lesson2_1 = await prisma.lesson.upsert({ where: { id: 'clseedlesson21'}, update: {}, create: { id: 'clseedlesson21', title: 'Evaluación de Conocimientos', moduleId: module2.id, order: 0 }});
  const blockQuiz = await prisma.contentBlock.upsert({ where: { id: 'clseedblock211'}, update: {}, create: { id: 'clseedblock211', type: 'QUIZ', lessonId: lesson2_1.id, order: 0 }});
  
  const quiz1 = await prisma.quiz.upsert({ where: { id: 'clseedquiz01' }, update: {}, create: { id: 'clseedquiz01', title: 'Quiz de Marketing', contentBlockId: blockQuiz.id }});
  const question1 = await prisma.question.upsert({ where: { id: 'clseedquestion01' }, update: {}, create: { id: 'clseedquestion01', text: '¿Qué significa SEO?', quizId: quiz1.id, order: 0 }});
  
  await prisma.answerOption.createMany({
    data: [
        { text: 'Search Engine Optimization', isCorrect: true, questionId: question1.id },
        { text: 'Social Engagement Office', isCorrect: false, questionId: question1.id },
        { text: 'Sales Efficiency Object', isCorrect: false, questionId: question1.id }
    ]
  });

  const lesson2_2 = await prisma.lesson.upsert({ where: { id: 'clseedlesson22' }, update: {}, create: { id: 'clseedlesson22', title: 'Glosario de Términos (PDF)', moduleId: module2.id, order: 1 }});
  await prisma.contentBlock.upsert({ where: { id: 'clseedblock221' }, update: {}, create: { id: 'clseedblock221', type: 'FILE', content: '/uploads/placeholder.pdf', lessonId: lesson2_2.id, order: 0 }});
  console.log('Cursos creados.');

  // --- 5. INSCRIPCIONES Y PROGRESO ---
  console.log('Simulando inscripciones y progreso...');
  // Estudiante 1 (Laura) inscrita en curso de instructor
  const enrollment1 = await prisma.enrollment.upsert({ 
    where: { userId_courseId: { userId: studentUser1.id, courseId: courseInstructor.id } },
    update: {},
    create: { userId: studentUser1.id, courseId: courseInstructor.id }
  });
  const progress1 = await prisma.courseProgress.upsert({ 
    where: { enrollmentId: enrollment1.id },
    update: {},
    create: { userId: studentUser1.id, courseId: courseInstructor.id, enrollmentId: enrollment1.id }
  });
  // Laura completó la lección 1
  await prisma.lessonCompletionRecord.upsert({ 
    where: { progressId_lessonId: { progressId: progress1.id, lessonId: lesson1_1.id } },
    update: {},
    create: { progressId: progress1.id, lessonId: lesson1_1.id, type: 'view' }
  });
  
  // Calcular y actualizar el progreso de Laura
  const totalLessonsCourse2 = await prisma.lesson.count({where: {module: {courseId: courseInstructor.id}}});
  const completedLessonsCourse2 = await prisma.lessonCompletionRecord.count({where: {progressId: progress1.id}});
  const progressPercentageLaura = totalLessonsCourse2 > 0 ? (completedLessonsCourse2 / totalLessonsCourse2) * 100 : 0;
  await prisma.courseProgress.update({
      where: { id: progress1.id },
      data: { progressPercentage: progressPercentageLaura }
  });


  // Estudiante 2 (Carlos) inscrito en curso de instructor, pero sin progreso
  const enrollment2 = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: studentUser2.id, courseId: courseInstructor.id } },
    update: {},
    create: {
      userId: studentUser2.id,
      courseId: courseInstructor.id,
    }
  });

  await prisma.courseProgress.upsert({
    where: { enrollmentId: enrollment2.id },
    update: {},
    create: {
        userId: studentUser2.id,
        courseId: courseInstructor.id,
        enrollmentId: enrollment2.id
    }
  });


  console.log('Inscripciones y progreso listos.');
  console.log('Seeding finalizado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el proceso de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
