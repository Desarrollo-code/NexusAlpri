// src/app/api/achievements/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { AchievementSlug, type Achievement, type UserAchievement } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Helper to calculate progress for specific achievements
async function getProgressForAchievement(userId: string, slug: AchievementSlug): Promise<{ current: number; target: number } | undefined> {
    
    // Ensure that slugs being checked are valid and expected to have progress.
    const progressTrackedSlugs = [
        AchievementSlug.FIVE_COURSES_COMPLETED,
        AchievementSlug.TEN_COURSES_COMPLETED,
        AchievementSlug.TWENTY_COURSES_COMPLETED,
    ];

    if (!progressTrackedSlugs.includes(slug)) {
        return undefined; // No progress logic for this achievement
    }
    
    try {
        const count = await prisma.courseProgress.count({ where: { userId, completedAt: { not: null } } });
        
        switch (slug) {
            case AchievementSlug.FIVE_COURSES_COMPLETED:
                return { current: count, target: 5 };
            case AchievementSlug.TEN_COURSES_COMPLETED:
                return { current: count, target: 10 };
            case AchievementSlug.TWENTY_COURSES_COMPLETED:
                return { current: count, target: 20 };
            default:
                return undefined;
        }
    } catch (error) {
        console.error(`Error calculating progress for achievement ${slug}:`, error);
        return undefined; // Return undefined on error to prevent crashes
    }
}

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const allAchievements = await prisma.achievement.findMany({
            orderBy: { points: 'asc' }
        });

        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId: session.id },
            select: { achievementId: true, unlockedAt: true }
        });
        
        const unlockedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua.unlockedAt]));

        const results = await Promise.all(allAchievements.map(async (ach) => {
            const isUnlocked = unlockedMap.has(ach.id);
            let progress;

            // Calculate progress only for achievements that are not yet unlocked
            if (!isUnlocked) {
                 progress = await getProgressForAchievement(session.id, ach.slug);
            }
            
            return {
                id: ach.id,
                name: ach.name,
                description: ach.description,
                slug: ach.slug,
                icon: ach.icon,
                points: ach.points,
                unlocked: isUnlocked,
                unlockedAt: isUnlocked ? unlockedMap.get(ach.id) : null,
                progress: progress
            };
        }));
        
        // Sort: progress > unlocked > locked by points
        results.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            if (a.progress && !b.progress) return -1;
            if (!a.progress && b.progress) return 1;
            return a.points - b.points;
        });

        return NextResponse.json(results);

    } catch (error) {
        console.error('[ACHIEVEMENTS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los logros' }, { status: 500 });
    }
}
