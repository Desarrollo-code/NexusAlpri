// src/lib/gamification.ts
import prisma from '@/lib/prisma';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

// --- CONFIGURACIÓN DE PUNTOS Y LOGROS ---
export const XP_CONFIG = {
    ENROLL_COURSE: 10,
    COMPLETE_LESSON: 5,
    COMPLETE_QUIZ: 15,
    PASS_QUIZ: 25, // Puntos extra por aprobar
    COMPLETE_COURSE: 100,
    REACT_TO_ANNOUNCEMENT: 1,
    TAKE_NOTE: 2,
    DOWNLOAD_RESOURCE: 5,
};

// Slugs de logros que deben existir en la tabla `Achievement`
// Sincronizado con el schema.prisma
export const ACHIEVEMENT_SLUGS = {
    FIRST_ENROLLMENT: 'FIRST_ENROLLMENT',
    FIRST_COURSE_COMPLETED: 'FIRST_COURSE_COMPLETED',
    PERFECT_QUIZ_SCORE: 'PERFECT_QUIZ_SCORE',
    FIVE_COURSES_COMPLETED: 'FIVE_COURSES_COMPLETED',
    FIRST_NOTE: 'FIRST_NOTE',
    FIRST_REACTION: 'FIRST_REACTION',
    FIRST_RESOURCE_DOWNLOAD: 'FIRST_RESOURCE_DOWNLOAD',
    FIRST_COURSE_PUBLISHED: 'FIRST_COURSE_PUBLISHED',
    TEN_COURSES_COMPLETED: 'TEN_COURSES_COMPLETED',
    TWENTY_COURSES_COMPLETED: 'TWENTY_COURSES_COMPLETED',
    HIGH_PERFORMER: 'HIGH_PERFORMER',
    LEVEL_5_REACHED: 'LEVEL_5_REACHED',
    LEVEL_10_REACHED: 'LEVEL_10_REACHED',
    LEVEL_20_REACHED: 'LEVEL_20_REACHED',
};

type AwardAchievementParams = {
    userId: string;
    slug: string;
}

// --- FUNCIONES PRINCIPALES ---

/**
 * Añade puntos de experiencia (XP) a un usuario y verifica si sube de nivel.
 */
export async function addXp(userId: string, points: number) {
    if (!userId || points <= 0) return;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true }});
        if (!user) return;
        const oldXp = user.xp || 0;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                xp: {
                    increment: points
                }
            },
        });
        
        await checkAndAwardLevelUp(updatedUser as User, oldXp);

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

        await prisma.notification.create({
            data: {
                userId,
                title: `¡Logro Desbloqueado: ${achievement.name}!`,
                description: `Has ganado ${achievement.points} puntos de experiencia.`,
                link: '/leaderboard'
            }
        });

    } catch (error) {
        console.error(`Error al otorgar el logro "${slug}" al usuario ${userId}:`, error);
    }
}

// --- FUNCIONES DE VERIFICACIÓN DE LOGROS ---

export async function checkAndAwardFirstEnrollment(userId: string) {
    const enrollmentCount = await prisma.enrollment.count({
        where: { userId }
    });
    if (enrollmentCount === 1) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIRST_ENROLLMENT });
    }
}

export async function checkAndAwardCourseCompletionAchievements(userId: string, finalScore?: number | null) {
    const completedCount = await prisma.courseProgress.count({
        where: { userId: userId, completedAt: { not: null } }
    });

    if (completedCount === 1) await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIRST_COURSE_COMPLETED });
    if (completedCount === 5) await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIVE_COURSES_COMPLETED });
    if (completedCount === 10) await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.TEN_COURSES_COMPLETED });
    if (completedCount === 20) await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.TWENTY_COURSES_COMPLETED });
    
    // Logro por alta calificación
    if (finalScore !== null && finalScore !== undefined && finalScore >= 95) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.HIGH_PERFORMER });
    }
}

export async function checkFirstNoteTaken(userId: string) {
    const noteCount = await prisma.userNote.count({ where: { userId } });
    if (noteCount === 1) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIRST_NOTE });
    }
}

export async function checkFirstReaction(userId: string) {
    const reactionCount = await prisma.announcementReaction.count({ where: { userId }});
    if (reactionCount === 1) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIRST_REACTION });
    }
}

export async function checkFirstDownload(userId: string) {
    // Esta función se puede expandir para registrar descargas.
    // Por ahora, asumimos que si se llama es la primera vez.
    const hasAchievement = await prisma.userAchievement.findFirst({
        where: { userId, achievement: { slug: ACHIEVEMENT_SLUGS.FIRST_RESOURCE_DOWNLOAD } }
    });
    if (!hasAchievement) {
        await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.FIRST_RESOURCE_DOWNLOAD });
    }
}

export async function checkFirstCoursePublished(instructorId: string) {
    const publishedCount = await prisma.course.count({ where: { instructorId, status: 'PUBLISHED' }});
    if (publishedCount === 1) {
        await awardAchievement({ userId: instructorId, slug: ACHIEVEMENT_SLUGS.FIRST_COURSE_PUBLISHED });
    }
}

// --- LÓGICA DE NIVELES ---
const calculateLevel = (xp: number) => {
    const baseXP = 250;
    const exponent = 1.5;
    let level = 1;
    let requiredXP = baseXP;
    while (xp >= requiredXP) {
        level++;
        xp -= requiredXP;
        requiredXP = Math.floor(baseXP * Math.pow(level, exponent));
    }
    return level;
};

export async function checkAndAwardLevelUp(user: User, oldXp: number) {
    if (user.xp === null || user.xp === undefined) return;

    const oldLevel = calculateLevel(oldXp);
    const newLevel = calculateLevel(user.xp);

    if (newLevel > oldLevel) {
        // El usuario subió de nivel
        await prisma.notification.create({
            data: {
                userId: user.id,
                title: `¡Has subido al Nivel ${newLevel}!`,
                description: `¡Felicidades por tu progreso! Sigue aprendiendo para alcanzar nuevas alturas.`,
                link: '/leaderboard'
            }
        });

        // Otorgar logros por alcanzar niveles específicos
        if (newLevel >= 5) await awardAchievement({ userId: user.id, slug: ACHIEVEMENT_SLUGS.LEVEL_5_REACHED });
        if (newLevel >= 10) await awardAchievement({ userId: user.id, slug: ACHIEVEMENT_SLUGS.LEVEL_10_REACHED });
        if (newLevel >= 20) await awardAchievement({ userId: user.id, slug: ACHIEVEMENT_SLUGS.LEVEL_20_REACHED });
    }
}
