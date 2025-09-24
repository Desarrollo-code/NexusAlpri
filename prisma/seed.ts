// prisma/seed.ts
import { PrismaClient, UserRole, AchievementSlug, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addDays, subDays } from 'date-fns';

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

const usersToSeed = [
    { name: 'Alejandra Giraldo', email: 'alejandra.giraldo@alprigrama.com', role: UserRole.ADMINISTRATOR, password: 'AlejaG*2025' },
    { name: 'Manuel Velásquez', email: 'manuel.velasquez@alprigrama.com', role: UserRole.INSTRUCTOR, password: 'Man_Velas!88' },
    { name: 'Laura Bedoya', email: 'laura.bedoya@alprigrama.com', role: UserRole.INSTRUCTOR, password: 'LauraB#2024' },
    { name: 'Juan Camilo Ríos', email: 'juan.rios@alprigrama.com', role: UserRole.STUDENT, password: 'JCRios@25' },
    { name: 'Valentina Duque', email: 'valentina.duque@alprigrama.com', role: UserRole.STUDENT, password: 'ValenD#99' },
    { name: 'Felipe Castro', email: 'felipe.castro@alprigrama.com', role: UserRole.STUDENT, password: 'FeliC-P@ss1' },
    { name: 'Catalina Morales', email: 'catalina.morales@alprigrama.com', role: UserRole.STUDENT, password: 'C_Mora!es22' },
    { name: 'Daniela Pérez', email: 'daniela.perez@alprigrama.com', role: UserRole.INSTRUCTOR, password: 'DaniP*P@ss1' },
    { name: 'Santiago Mesa', email: 'santiago.mesa@alprigrama.com', role: UserRole.STUDENT, password: 'Santi_Mesa!1' },
    { name: 'Carolina Estrada', email: 'carolina.estrada@alprigrama.com', role: UserRole.STUDENT, password: 'C.Estrada$2025' },
    { name: 'Martina Giraldo', email: 'martina.giraldo@alprigrama.com', role: UserRole.STUDENT, password: 'MartiG_1!' },
    { name: 'Juan Diego Cardona', email: 'juan.cardona@alprigrama.com', role: UserRole.STUDENT, password: 'JDcardona@2025' },
    { name: 'Valeria Vélez', email: 'valeria.velez@alprigrama.com', role: UserRole.STUDENT, password: 'VVelez#_88' },
    { name: 'Ricardo Montoya', email: 'ricardo.montoya@alprigrama.com', role: UserRole.INSTRUCTOR, password: 'R.Montoya!23' },
    { name: 'Fernanda Sánchez', email: 'fernanda.sanchez@alprigrama.com', role: UserRole.STUDENT, password: 'F.Sanchex_4' },
    { name: 'Oscar Ramírez', email: 'oscar.ramirez@alprigrama.com', role: UserRole.STUDENT, password: 'O-Ramirez#77' },
    { name: 'Paola López', email: 'paola.lopez@alprigrama.com', role: UserRole.ADMINISTRATOR, password: 'PaoL_Adm!2025' },
    { name: 'Gustavo Cárdenas', email: 'gustavo.cardenas@alprigrama.com', role: UserRole.INSTRUCTOR, password: 'G_Carde!nas1' },
    { name: 'Natalia Ríos', email: 'natalia.rios@alprigrama.com', role: UserRole.STUDENT, password: 'Natali_R$9' },
    { name: 'Camilo Vélez', email: 'camilo.velez@alprigrama.com', role: UserRole.STUDENT, password: 'CamiV_33#' },
    { name: 'Karol Nuñez', email: 'karol.nunez@alprigrama.com', role: UserRole.INSTRUCTOR, password: 'J10v24m30*.' },
    { name: 'Administrador', email: 'admin@alprigrama.com', role: UserRole.ADMINISTRATOR, password: 'Administrador123*.' },
];

async function main() {
  console.log('Iniciando el proceso de seeding...');
  
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
  console.log('Creando y/o actualizando usuarios de la lista...');
  const userUpsertPromises = usersToSeed.map(async user => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    return prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password: hashedPassword,
        isActive: true,
      },
      create: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
        role: user.role,
        isActive: true,
      },
    });
  });

  const createdUsers = await Promise.all(userUpsertPromises);
  console.log(`${createdUsers.length} usuarios procesados.`);
  
  // Obtener IDs de usuarios clave para asignaciones posteriores
  const getUserId = (email: string) => createdUsers.find(u => u.email === email)?.id;
  
  const adminUserId = getUserId('admin@alprigrama.com');
  const instructorUserId = getUserId('manuel.velasquez@alprigrama.com');
  const student1Id = getUserId('juan.rios@alprigrama.com');
  const student2Id = getUserId('valentina.duque@alprigrama.com');
  
  if(!adminUserId || !instructorUserId || !student1Id || !student2Id) {
      console.error("No se encontraron los IDs de los usuarios clave. Abortando el resto del seed.");
      return;
  }
  const adminUser = { id: adminUserId };
  const instructorUser = { id: instructorUserId };
  const studentUser1 = { id: student1Id };
  const studentUser2 = { id: student2Id };


  // --- 3. ANUNCIOS (5 en total) ---
  console.log('Creando anuncios...');
  await prisma.announcement.deleteMany({}); // Limpiar anuncios antiguos
  await prisma.announcement.createMany({
    data: [
        { id: 'clseedannouncement01', title: '¡Bienvenid@ a la nueva plataforma de aprendizaje!', content: '<p>Estamos muy emocionados de lanzar esta nueva herramienta para potenciar tu desarrollo profesional.</p>', authorId: adminUser.id, audience: 'ALL', priority: 'Normal' },
        { id: 'clseedannouncement02', title: 'Alerta de Mantenimiento Programado', content: '<p>La plataforma estará en mantenimiento este viernes por la noche de 10 PM a 11 PM. Agradecemos su comprensión.</p>', authorId: adminUser.id, audience: 'ALL', priority: 'Urgente', isPinned: true },
        { id: 'clseedannouncement03', title: '¡Nuevo curso de Liderazgo disponible!', content: '<p>Inscríbete ahora en el nuevo curso "Liderazgo Efectivo para Equipos Remotos" impartido por un instructor.</p>', authorId: instructorUser.id, audience: 'ALL', priority: 'Normal' },
        { id: 'clseedannouncement04', title: 'Recordatorio: Actualización de Políticas de Seguridad', content: '<p>Todos los instructores deben revisar la nueva guía de seguridad de la información en la Biblioteca de Recursos antes de fin de mes.</p>', authorId: adminUser.id, audience: 'INSTRUCTOR', priority: 'Normal' },
        { id: 'clseedannouncement05', title: 'Evento Social: After Office Virtual', content: '<p>¡Únete a nuestro After Office virtual este jueves! Revisa el calendario para más detalles y confirmar tu asistencia.</p>', authorId: studentUser1.id, audience: 'STUDENT', priority: 'Normal' }
    ],
    skipDuplicates: true
  });
  console.log('Anuncios creados.');

  // --- 4. EVENTOS DEL CALENDARIO (15 en total) ---
  console.log('Creando eventos del calendario...');
  await prisma.calendarEvent.deleteMany({}); // Limpiar eventos antiguos
  const now = new Date();
  await prisma.calendarEvent.createMany({
    data: [
      { id: 'clseedevent01', title: 'Reunión Trimestral de Resultados', start: new Date(now.getFullYear(), now.getMonth(), 15, 10, 0), end: new Date(now.getFullYear(), now.getMonth(), 15, 11, 30), audienceType: 'ALL', creatorId: adminUser.id, color: 'blue' },
      { id: 'clseedevent02', title: 'Taller: Técnicas de Venta Avanzadas', start: new Date(now.getFullYear(), now.getMonth(), 5, 9, 0), end: new Date(now.getFullYear(), now.getMonth(), 5, 12, 0), audienceType: 'STUDENT', creatorId: instructorUser.id, color: 'green', location: 'Sala de Conferencias 3' },
      { id: 'clseedevent03', title: 'Fecha Límite: Reporte de Ventas Q2', start: new Date(now.getFullYear(), now.getMonth(), 10), end: new Date(now.getFullYear(), now.getMonth(), 10), allDay: true, audienceType: 'INSTRUCTOR', creatorId: adminUser.id, color: 'red' },
      { id: 'clseedevent04', title: 'Reunión de Planificación (Instructores)', start: subDays(now, 5), end: subDays(now, 5), audienceType: 'INSTRUCTOR', creatorId: adminUser.id, color: 'orange', videoConferenceLink: 'https://meet.google.com/xyz-abc' },
      { id: 'clseedevent05', title: 'Coffee & Code: Sesión informal', start: addDays(now, 2), end: addDays(now, 2), audienceType: 'ALL', creatorId: studentUser2.id, color: 'orange' },
      { id: 'clseedevent06', title: 'Revisión de Contenido de Cursos', start: new Date(now.getFullYear(), now.getMonth(), 20, 14, 0), end: new Date(now.getFullYear(), now.getMonth(), 20, 16, 0), audienceType: 'ADMINISTRATOR', creatorId: adminUser.id, color: 'purple' },
      { id: 'clseedevent07', title: 'Presentación Nuevo Producto "Orion"', start: addDays(now, 7), end: addDays(now, 7), allDay: true, audienceType: 'ALL', creatorId: adminUser.id, color: 'blue' },
      { id: 'clseedevent08', title: 'Q&A con el CEO', start: new Date(now.getFullYear(), now.getMonth(), 25, 11, 0), end: new Date(now.getFullYear(), now.getMonth(), 25, 12, 0), audienceType: 'ALL', creatorId: adminUser.id, color: 'green' },
      { id: 'clseedevent09', title: 'Día de Formación en Ciberseguridad', start: addDays(now, 10), end: addDays(now, 10), audienceType: 'ALL', creatorId: adminUser.id, color: 'red', allDay: true },
      { id: 'clseedevent10', title: 'Reunión 1-a-1: Estudiante y Instructor', start: new Date(now.getFullYear(), now.getMonth(), 3, 15, 0), end: new Date(now.getFullYear(), now.getMonth(), 3, 15, 30), audienceType: 'SPECIFIC', creatorId: instructorUser.id, color: 'blue' },
      { id: 'clseedevent11', title: 'Workshop: Storytelling para Ventas', start: addDays(now, 12), end: addDays(now, 12), audienceType: 'STUDENT', creatorId: instructorUser.id, color: 'green' },
      { id: 'clseedevent12', title: 'Feriado Nacional', start: new Date(2024, 6, 20), end: new Date(2024, 6, 20), allDay: true, audienceType: 'ALL', creatorId: adminUser.id, color: 'orange' },
      { id: 'clseedevent13', title: 'Cierre Fiscal Mensual', start: new Date(now.getFullYear(), now.getMonth(), 28), end: new Date(now.getFullYear(), now.getMonth(), 28), allDay: true, audienceType: 'ADMINISTRATOR', creatorId: adminUser.id, color: 'red' },
      { id: 'clseedevent14', title: 'Demostración Cliente "Acmé"', start: addDays(now, 4), end: addDays(now, 4), audienceType: 'SPECIFIC', creatorId: instructorUser.id, color: 'blue' },
      { id: 'clseedevent15', title: 'Evento Social: Fin de Mes', start: new Date(now.getFullYear(), now.getMonth(), 30, 17, 0), end: new Date(now.getFullYear(), now.getMonth(), 30, 19, 0), audienceType: 'ALL', creatorId: studentUser1.id, color: 'green' },
    ],
    skipDuplicates: true
  });
  // Asignar asistentes específicos a eventos
  await prisma.calendarEvent.update({ where: { id: 'clseedevent10' }, data: { attendees: { connect: [{ id: studentUser1.id }] } } });
  await prisma.calendarEvent.update({ where: { id: 'clseedevent14' }, data: { attendees: { connect: [{ id: studentUser2.id }, { id: instructorUser.id }] } } });

  console.log('Eventos del calendario creados.');

  // --- 5. BIBLIOTECA DE RECURSOS (ampliado) ---
  console.log('Creando recursos de la biblioteca...');
  await prisma.enterpriseResource.deleteMany({}); // Limpiar recursos
  const pinHash = await bcrypt.hash('1234', 10);
  const folderRRHH = await prisma.enterpriseResource.create({ data: { id: 'clseedfolder01', title: 'Documentos de RRHH', type: 'FOLDER', uploaderId: adminUser.id, ispublic: true }});
  await prisma.enterpriseResource.createMany({
      data: [
        { id: 'clseedresource01', title: 'Guía de Beneficios 2024', type: 'DOCUMENT', uploaderId: adminUser.id, parentId: folderRRHH.id, url: '/uploads/placeholder.pdf', pin: pinHash, ispublic: true, category: 'Recursos Humanos' },
        { id: 'clseedresource02', title: 'Política de Teletrabajo', type: 'DOCUMENT', uploaderId: adminUser.id, parentId: folderRRHH.id, url: '/uploads/placeholder.pdf', ispublic: true, category: 'Recursos Humanos' },
      ],
      skipDuplicates: true
  });
  const folderMarketing = await prisma.enterpriseResource.create({ data: { id: 'clseedfolder02', title: 'Marketing y Ventas', type: 'FOLDER', uploaderId: instructorUser.id, ispublic: true }});
  await prisma.enterpriseResource.createMany({
      data: [
        { id: 'clseedresource03', title: 'Video Institucional 2024', type: 'VIDEO', uploaderId: instructorUser.id, parentId: folderMarketing.id, url: 'https://www.youtube.com/watch?v=6c5y4_DBw_g', ispublic: true, category: 'Marketing' },
        { id: 'clseedresource04', title: 'Manual de Marca', type: 'DOCUMENT', uploaderId: instructorUser.id, parentId: folderMarketing.id, url: '/uploads/placeholder.pdf', ispublic: false, category: 'Marketing' }, // Privado
      ],
      skipDuplicates: true
  });
  await prisma.enterpriseResource.update({ where: { id: 'clseedresource04' }, data: { sharedWith: { connect: [{ id: studentUser1.id }] } } });
  console.log('Recursos creados.');

  // --- 6. CURSOS Y CONTENIDO (Limpiando y creando) ---
  console.log('Limpiando datos de cursos antiguos...');
  await prisma.course.deleteMany({});
  console.log('Creando cursos de prueba...');

  const courseAdmin = await prisma.course.create({ data: { id: 'clseedcourse01', title: 'Curso de Bienvenida a NexusAlpri', description: 'Un curso rápido para conocer la plataforma.', category: 'Formación Interna', instructorId: adminUser.id, status: 'PUBLISHED' }});
  const courseInstructor = await prisma.course.create({ data: { id: 'clseedcourse02', title: 'Marketing Digital para Principiantes', description: 'Aprende los fundamentos del marketing digital desde cero.', category: 'Marketing', instructorId: instructorUser.id, status: 'PUBLISHED', imageUrl: '/uploads/courses/marketing_cover.jpg' }});
  await prisma.course.create({ data: { id: 'clseedcourse03', title: 'Gestión de Proyectos con Metodologías Ágiles', description: 'Domina Scrum y Kanban para llevar tus proyectos al siguiente nivel.', category: 'Operaciones', instructorId: adminUser.id, status: 'DRAFT' }});

  // Contenido curso Marketing
  const module1 = await prisma.module.create({ data: { id: 'clseedmodule01', title: 'Módulo 1: Introducción al Marketing', courseId: courseInstructor.id, order: 0 }});
  const lesson1_1 = await prisma.lesson.create({ data: { id: 'clseedlesson11', title: '¿Qué es el Marketing Digital?', moduleId: module1.id, order: 0 }});
  await prisma.contentBlock.create({ data: { id: 'clseedblock111', type: 'TEXT', content: '<p>El marketing digital es la aplicación de las estrategias de comercialización llevadas a cabo en los medios digitales.</p>', lessonId: lesson1_1.id, order: 0 }});
  const lesson1_2 = await prisma.lesson.create({ data: { id: 'clseedlesson12', title: 'Video: ¿Qué es el SEO?', moduleId: module1.id, order: 1 }});
  await prisma.contentBlock.create({ data: { id: 'clseedblock121', type: 'VIDEO', content: 'https://www.youtube.com/watch?v=6c5y4_DBw_g', lessonId: lesson1_2.id, order: 0 }});
  const module2 = await prisma.module.create({ data: { id: 'clseedmodule02', title: 'Módulo 2: Herramientas Clave', courseId: courseInstructor.id, order: 1 }});
  const lesson2_1 = await prisma.lesson.create({ data: { id: 'clseedlesson21', title: 'Evaluación de Conocimientos', moduleId: module2.id, order: 0 }});
  const blockQuiz = await prisma.contentBlock.create({ data: { id: 'clseedblock211', type: 'QUIZ', lessonId: lesson2_1.id, order: 0 }});
  const quiz1 = await prisma.quiz.create({ data: { id: 'clseedquiz01', title: 'Quiz de Marketing', contentBlockId: blockQuiz.id, maxAttempts: 3 }});
  const question1 = await prisma.question.create({ data: { id: 'clseedquestion01', text: '¿Qué significa SEO?', quizId: quiz1.id, order: 0, type: 'SINGLE_CHOICE' }});
  await prisma.answerOption.createMany({ data: [ { text: 'Search Engine Optimization', isCorrect: true, questionId: question1.id, points: 10 }, { text: 'Social Engagement Office', isCorrect: false, questionId: question1.id, points: 0 }, { text: 'Sales Efficiency Object', isCorrect: false, questionId: question1.id, points: 0 } ] });
  const lesson2_2 = await prisma.lesson.create({ data: { id: 'clseedlesson22', title: 'Glosario de Términos (PDF)', moduleId: module2.id, order: 1 }});
  await prisma.contentBlock.create({ data: { id: 'clseedblock221', type: 'FILE', content: '/uploads/placeholder.pdf', lessonId: lesson2_2.id, order: 0 }});
  console.log('Cursos creados.');

  // --- 7. INSCRIPCIONES Y PROGRESO ---
  console.log('Simulando inscripciones y progreso...');
  const enrollment1 = await prisma.enrollment.create({ data: { userId: studentUser1.id, courseId: courseInstructor.id }});
  const progress1 = await prisma.courseProgress.create({ data: { userId: studentUser1.id, courseId: courseInstructor.id, enrollmentId: enrollment1.id }});
  await prisma.lessonCompletionRecord.create({ data: { progressId: progress1.id, lessonId: lesson1_1.id, type: 'view' }});
  const totalLessonsCourse2 = await prisma.lesson.count({where: {module: {courseId: courseInstructor.id}}});
  const completedLessonsCourse2 = await prisma.lessonCompletionRecord.count({where: {progressId: progress1.id}});
  const progressPercentageLaura = totalLessonsCourse2 > 0 ? (completedLessonsCourse2 / totalLessonsCourse2) * 100 : 0;
  await prisma.courseProgress.update({ where: { id: progress1.id }, data: { progressPercentage: progressPercentageLaura }});

  const enrollment2 = await prisma.enrollment.create({ data: { userId: studentUser2.id, courseId: courseInstructor.id }});
  await prisma.courseProgress.create({ data: { userId: studentUser2.id, courseId: courseInstructor.id, enrollmentId: enrollment2.id }});
  console.log('Inscripciones y progreso listos.');
  
  // --- 8. FORMULARIOS ---
  console.log('Creando formularios de prueba...');
  await prisma.form.deleteMany({}); // Limpiar formularios
  await prisma.form.create({
    data: {
      title: 'Encuesta de Clima Laboral Q3',
      description: 'Tu opinión es muy importante para nosotros. Por favor, responde con sinceridad.',
      creatorId: adminUser.id,
      status: 'PUBLISHED',
      isQuiz: false,
      fields: {
        create: [
          { label: 'En una escala del 1 al 5, ¿qué tan satisfecho estás con tu carga de trabajo actual?', type: 'SINGLE_CHOICE', order: 0, required: true, options: [ {id: 's1', text: '1 - Muy insatisfecho', isCorrect: false, points: 0}, {id: 's2', text: '2', isCorrect: false, points: 0}, {id: 's3', text: '3', isCorrect: false, points: 0}, {id: 's4', text: '4', isCorrect: false, points: 0}, {id: 's5', text: '5 - Muy satisfecho', isCorrect: false, points: 0}, ] },
          { label: '¿Qué aspectos mejorarías de la comunicación interna? (Selecciona todos los que apliquen)', type: 'MULTIPLE_CHOICE', order: 1, required: false, options: [ {id: 'c1', text: 'Más reuniones generales', isCorrect: false, points: 0}, {id: 'c2', text: 'Comunicación más clara de los objetivos', isCorrect: false, points: 0}, {id: 'c3', text: 'Más feedback de mi manager', isCorrect: false, points: 0}, {id: 'c4', text: 'Mejor uso del email/chat', isCorrect: false, points: 0} ] },
          { label: 'Si pudieras cambiar una cosa de la oficina, ¿qué sería?', type: 'TEXTAREA', order: 2, required: false, placeholder: 'Ej: más plantas, mejor café, etc.' }

        ]
      }
    }
  });
  console.log('Formularios creados.');


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
