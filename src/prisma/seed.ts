// prisma/seed.ts
import { PrismaClient, UserRole, AchievementSlug, RecurrenceType, FormStatus, FormFieldType } from '@prisma/client';
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
  { slug: AchievementSlug.FIRST_NOTE, name: 'Curiosidad Intelectual', description: 'Has tomado tu primer apunte en una lección.', points: 15, icon: 'Notebook' },
  { slug: AchievementSlug.FIRST_REACTION, name: 'Voz Activa', description: 'Has reaccionado por primera vez a un anuncio.', points: 5, icon: 'Megaphone' },
  { slug: AchievementSlug.FIRST_RESOURCE_DOWNLOAD, name: 'Explorador de Conocimiento', description: 'Has descargado tu primer recurso de la biblioteca.', points: 15, icon: 'Compass' },
  { slug: AchievementSlug.FIRST_COURSE_PUBLISHED, name: 'Creador de Contenido', description: 'Has publicado tu primer curso.', points: 150, icon: 'Send' },
  { slug: AchievementSlug.TEN_COURSES_COMPLETED, name: 'Ratón de Biblioteca', description: 'Has completado diez cursos.', points: 500, icon: 'Library' },
  { slug: AchievementSlug.TWENTY_COURSES_COMPLETED, name: 'Sabio de Nexus', description: 'Has completado veinte cursos.', points: 1000, icon: 'BrainCircuit' },
  { slug: AchievementSlug.HIGH_PERFORMER, name: 'Estudiante Estrella', description: 'Completaste un curso con una calificación de 95% o más.', points: 75, icon: 'Star' },
  { slug: AchievementSlug.LEVEL_5_REACHED, name: 'Aprendiz Dedicado', description: 'Alcanzaste el Nivel 5.', points: 100, icon: 'ChevronsUp' },
  { slug: AchievementSlug.LEVEL_10_REACHED, name: 'Maestro del Conocimiento', description: 'Alcanzaste el Nivel 10.', points: 200, icon: 'Crown' },
  { slug: AchievementSlug.LEVEL_20_REACHED, name: 'Leyenda de la Plataforma', description: 'Alcanzaste el Nivel 20.', points: 400, icon: 'Gem' },
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
  console.log('Iniciando el proceso de seeding no destructivo...');
  
  // --- 1. CONFIGURACIÓN Y LOGROS (siempre `upsert`) ---
  console.log('Verificando configuración y logros...');
  await prisma.platformSettings.upsert({
      where: { id: 'cl-nexus-settings-default' },
      update: {},
      create: {
            id: 'cl-nexus-settings-default',
            platformName: "NexusAlpri", 
            allowPublicRegistration: true, 
            enableEmailNotifications: true, 
            emailWhitelist: "alprigrama.com",
            resourceCategories: "Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General",
            passwordMinLength: 8, passwordRequireUppercase: true, passwordRequireLowercase: true, passwordRequireNumber: true, passwordRequireSpecialChar: false,
            enableIdleTimeout: true, idleTimeoutMinutes: 20, require2faForAdmins: false,
            primaryColor: '#6366f1', secondaryColor: '#a5b4fc', accentColor: '#ec4899', backgroundColorLight: '#f8fafc',
            primaryColorDark: '#a5b4fc', backgroundColorDark: '#020617',
            fontHeadline: 'Space Grotesk', fontBody: 'Inter',
            announcementsImageUrl: 'https://izefimwyuayfvektsstg.supabase.co/storage/v1/object/public/settings_images/announcement-bg.jpg',
      }
  });

  for (const ach of achievementsToSeed) {
    await prisma.achievement.upsert({ where: { slug: ach.slug }, update: {}, create: ach });
  }
  console.log('Configuración y logros listos.');

  // --- 2. USUARIOS (siempre `upsert`) ---
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
  
  const getUserId = (email: string) => createdUsers.find(u => u.email === email)?.id;
  
  const adminUserId = getUserId('admin@alprigrama.com');
  const instructorUserId = getUserId('manuel.velasquez@alprigrama.com');
  const student1Id = getUserId('juan.rios@alprigrama.com');
  const student2Id = getUserId('valentina.duque@alprigrama.com');
  
  if(!adminUserId || !instructorUserId || !student1Id || !student2Id) {
      console.error("No se encontraron los IDs de los usuarios clave. Abortando el resto del seed.");
      return;
  }

  // --- ANUNCIOS, EVENTOS, RECURSOS, CURSOS (usando `upsert`) ---
  console.log('Sincronizando datos de prueba (anuncios, eventos, etc.)...');
  
  const announcementsData = [
    { id: 'clseedannouncement01', title: '¡Bienvenid@ a la nueva plataforma de aprendizaje!', content: '<p>Estamos muy emocionados de lanzar esta nueva herramienta para potenciar tu desarrollo profesional.</p>', authorId: adminUserId, audience: 'ALL' as const, priority: 'Normal' as const, isPinned: false },
    { id: 'clseedannouncement02', title: 'Alerta de Mantenimiento Programado', content: '<p>La plataforma estará en mantenimiento este viernes por la noche de 10 PM a 11 PM.</p>', authorId: adminUserId, audience: 'ALL' as const, priority: 'Urgente' as const, isPinned: true },
    { id: 'clseedannouncement03', title: '¡Nuevo curso de Liderazgo disponible!', content: '<p>Inscríbete ahora en el nuevo curso "Liderazgo Efectivo para Equipos Remotos".</p>', authorId: instructorUserId, audience: 'ALL' as const, priority: 'Normal' as const, isPinned: false },
  ];
  for (const data of announcementsData) {
    await prisma.announcement.upsert({ where: { id: data.id }, update: data, create: data });
  }

  const now = new Date();
  const eventsData = [
      { id: 'clseedevent01', title: 'Reunión Trimestral de Resultados', start: new Date(now.getFullYear(), now.getMonth(), 15, 10, 0), end: new Date(now.getFullYear(), now.getMonth(), 15, 11, 30), audienceType: 'ALL' as const, creatorId: adminUserId, color: 'blue' },
      { id: 'clseedevent02', title: 'Pausa Activa Diaria', start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30), end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 45), audienceType: 'ALL' as const, creatorId: adminUserId, color: 'green', recurrence: RecurrenceType.DAILY, recurrenceEndDate: addDays(now, 30) },
  ];
  for (const data of eventsData) {
    await prisma.calendarEvent.upsert({ where: { id: data.id }, update: data, create: data });
  }

  const pinHash = await bcrypt.hash('1234', 10);
  const folderRRHH = await prisma.enterpriseResource.upsert({ where: { id: 'clseedfolder01' }, update: { title: 'Documentos de RRHH'}, create: { id: 'clseedfolder01', title: 'Documentos de RRHH', type: 'FOLDER', uploaderId: adminUserId, ispublic: true, status: 'ACTIVE' }});
  await prisma.enterpriseResource.upsert({ where: { id: 'clseedresource01' }, update: {}, create: { id: 'clseedresource01', title: 'Guía de Beneficios 2024', type: 'DOCUMENT', uploaderId: adminUserId, parentId: folderRRHH.id, url: '/uploads/placeholder.pdf', pin: pinHash, ispublic: true, category: 'Recursos Humanos', status: 'ACTIVE', expiresAt: addDays(new Date(), 45) }});

  const courseAdmin = await prisma.course.upsert({ where: { id: 'clseedcourse01' }, update: {}, create: { id: 'clseedcourse01', title: 'Curso de Bienvenida a NexusAlpri', description: 'Un curso rápido para conocer la plataforma.', category: 'Formación Interna', instructorId: adminUserId, status: 'PUBLISHED' }});
  const courseInstructor = await prisma.course.upsert({ where: { id: 'clseedcourse02' }, update: {}, create: { id: 'clseedcourse02', title: 'Marketing Digital para Principiantes', description: 'Aprende los fundamentos del marketing digital desde cero.', category: 'Marketing', instructorId: instructorUserId, status: 'PUBLISHED', imageUrl: null }});

  const module1 = await prisma.module.upsert({ where: { id: 'clseedmodule01' }, update: { title: 'Módulo 1: Introducción al Marketing'}, create: { id: 'clseedmodule01', title: 'Módulo 1: Introducción al Marketing', courseId: courseInstructor.id, order: 0 }});
  const lesson1_1 = await prisma.lesson.upsert({ where: { id: 'clseedlesson11' }, update: {}, create: { id: 'clseedlesson11', title: '¿Qué es el Marketing Digital?', moduleId: module1.id, order: 0 }});
  await prisma.contentBlock.upsert({ where: { id: 'clseedblock111' }, update: {}, create: { id: 'clseedblock111', type: 'TEXT', content: '<p>El marketing digital es la aplicación de las estrategias de comercialización llevadas a cabo en los medios digitales.</p>', lessonId: lesson1_1.id, order: 0 }});
  const lesson1_2 = await prisma.lesson.upsert({ where: { id: 'clseedlesson12' }, update: {}, create: { id: 'clseedlesson12', title: 'Video: ¿Qué es el SEO?', moduleId: module1.id, order: 1 }});
  // Video de YouTube de prueba garantizado para funcionar
  await prisma.contentBlock.upsert({ where: { id: 'clseedblock121' }, update: { content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, create: { id: 'clseedblock121', type: 'VIDEO', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', lessonId: lesson1_2.id, order: 0 }});
  
  // Para inscripciones, es mejor verificar y crear si no existen, para no sobreescribir progreso.
  await prisma.enrollment.upsert({ where: { userId_courseId: { userId: student1Id, courseId: courseInstructor.id } }, update: {}, create: { userId: student1Id, courseId: courseInstructor.id, progress: { create: { userId: student1Id, courseId: courseInstructor.id }}}});
  await prisma.enrollment.upsert({ where: { userId_courseId: { userId: student2Id, courseId: courseInstructor.id } }, update: {}, create: { userId: student2Id, courseId: courseInstructor.id, progress: { create: { userId: student2Id, courseId: courseInstructor.id }}}});

  console.log('Sincronización de datos de prueba finalizada.');
  console.log('Seeding no destructivo completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error durante el proceso de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
