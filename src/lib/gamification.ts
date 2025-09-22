// src/lib/gamification.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// --- CONFIGURACIÓN DE PUNTOS Y LOGROS ---
export const XP_CONFIG = {
    ENROLL_COURSE: 10,
    COMPLETE_LESSON: 5,
    COMPLETE_QUIZ: 15,
    PASS_QUIZ: 25, // Puntos extra por aprobar
    COMPLETE_COURSE: 100,
};

// Slugs de logros que deben existir en la tabla `Achievement`
export const ACHIEVEMENT_SLUGS = {
    FIRST_ENROLLMENT: 'first-enrollment',
    FIRST_COURSE_COMPLETED: 'first-course-completed',
    PERFECT_SCORE: 'perfect-quiz-score',
    FIVE_COURSES_COMPLETED: 'five-courses-completed',
};

type AwardAchievementParams = {
    userId: string;
    slug: string;
}

// --- FUNCIONES PRINCIPALES ---

/**
 * Añade puntos de experiencia (XP) a un usuario.
 */
export async function addXp(userId: string, points: number) {
    if (!userId || points <= 0) return;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                xp: {
                    increment: points
                }
            }
        });
    } catch (error) {
        console.error(`Error al añadir ${points} XP al usuario ${userId}:`, error);
    }
}

/**
 * Otorga un logro a un usuario si aún no lo tiene.
 */
export async function awardAchievement({ userId, slug }: AwardAchievementParams) {
    if (!userId || !slug) return;
    
    try {
        // Verificar si el usuario ya tiene el logro
        const achievement = await prisma.achievement.findUnique({
            where: { slug: slug }
        });

        if (!achievement) {
            console.warn(`Se intentó otorgar un logro con slug inexistente: "${slug}"`);
            return;
        }

        const existingAchievement = await prisma.userAchievement.findUnique({
            where: { userId_achievementId: { userId, achievementId: achievement.id } },
        });

        if (existingAchievement) {
            return; // El usuario ya tiene este logro
        }

        // Otorgar el logro y los puntos asociados
        await prisma.$transaction([
            prisma.userAchievement.create({
                data: {
                    userId: userId,
                    achievementId: achievement.id,
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    xp: {
                        increment: achievement.points
                    }
                }
            })
        ]);

        // (Opcional) Crear una notificación para el usuario
        await prisma.notification.create({
            data: {
                userId,
                title: `¡Logro Desbloqueado: ${achievement.name}!`,
                description: `Has ganado ${achievement.points} puntos de experiencia.`,
                link: '/profile'
            }
        });

    } catch (error) {
        console.error(`Error al otorgar el logro "${slug}" al usuario ${userId}:`, error);
    }
}

/**
 * Verifica si el usuario debería recibir un logro de "primer curso".
 */
export async function checkAndAwardFirstEnrollment(userId: string) {
    const enrollmentCount = await prisma.enrollment.count({
        where: { userId }
    });
    if (enrollmentCount === 1) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIRST_ENROLLMENT });
    }
}


/**
 * Verifica si el usuario debería recibir un logro por cursos completados.
 */
export async function checkAndAwardCourseCompletionAchievements(userId: string) {
    const completedCoursesCount = await prisma.courseProgress.count({
        where: {
            userId: userId,
            progressPercentage: 100,
        }
    });

    if (completedCoursesCount === 1) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIRST_COURSE_COMPLETED });
    }
    if (completedCoursesCount === 5) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIVE_COURSES_COMPLETED });
    }
}
