// prisma/seed.ts
import { PrismaClient, UserRole, AchievementSlug } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const achievementsToSeed = [
  {
    slug: AchievementSlug.FIRST_ENROLLMENT,
    name: 'Primer Paso',
    description: 'Te has inscrito en tu primer curso.',
    points: 10,
    icon: 'Footprints',
  },
  {
    slug: AchievementSlug.FIRST_COURSE_COMPLETED,
    name: 'Finalista',
    description: 'Has completado tu primer curso.',
    points: 100,
    icon: 'GraduationCap',
  },
  {
    slug: AchievementSlug.PERFECT_SCORE,
    name: 'Perfeccionista',
    description: 'Obtuviste una puntuación perfecta en un quiz.',
    points: 50,
    icon: 'Target',
  },
  {
    slug: AchievementSlug.FIVE_COURSES_COMPLETED,
    name: 'Maratonista del Saber',
    description: 'Has completado cinco cursos.',
    points: 250,
    icon: 'Award',
  },
];

async function main() {
  console.log('Iniciando el proceso de seeding...');

  // 1. Crear o encontrar el usuario administrador
  const adminEmail = 'admin@nexus.com';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.log('Usuario administrador no encontrado, creando uno nuevo...');
    const hashedPassword = await bcrypt.hash('nexuspro', 10); // Contraseña por defecto
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Administrador',
        password: hashedPassword,
        role: UserRole.ADMINISTRATOR,
        isActive: true,
      },
    });
    console.log(`Usuario administrador creado con email: ${adminEmail} y contraseña: nexuspro`);
  } else {
    console.log('Usuario administrador ya existe.');
  }

  // 2. Crear los logros (Achievements) si no existen
  console.log('Verificando y creando logros...');
  for (const achievementData of achievementsToSeed) {
    const existingAchievement = await prisma.achievement.findUnique({
      where: { slug: achievementData.slug },
    });
    if (!existingAchievement) {
      await prisma.achievement.create({
        data: achievementData,
      });
      console.log(`- Logro "${achievementData.name}" creado.`);
    }
  }
  console.log('Logros verificados.');
  
  // 3. Crear la configuración inicial si no existe
  const existingSettings = await prisma.platformSettings.findFirst();
  if (!existingSettings) {
    console.log('No se encontró configuración de la plataforma, creando una por defecto...');
    await prisma.platformSettings.create({
        data: {
            platformName: "NexusAlpri",
            allowPublicRegistration: true,
            enableEmailNotifications: true,
            resourceCategories: "Recursos Humanos,TI y Seguridad,Marketing,Ventas,Legal,Operaciones,Finanzas,Formación Interna,Documentación de Producto,General",
            passwordMinLength: 8,
            passwordRequireUppercase: true,
            passwordRequireLowercase: true,
            passwordRequireNumber: true,
            passwordRequireSpecialChar: true,
            enableIdleTimeout: true,
            idleTimeoutMinutes: 20,
            require2faForAdmins: false,
            primaryColor: '#6366f1',
            secondaryColor: '#a5b4fc',
            accentColor: '#ec4899',
            backgroundColorLight: '#f8fafc',
            primaryColorDark: '#a5b4fc',
            backgroundColorDark: '#020617',
            fontHeadline: 'Space Grotesk',
            fontBody: 'Inter',
        }
    });
     console.log('Configuración de la plataforma creada.');
  } else {
    console.log('La configuración de la plataforma ya existe.');
  }

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
