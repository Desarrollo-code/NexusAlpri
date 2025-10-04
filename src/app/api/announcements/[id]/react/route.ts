// src/app/api/announcements/[id]/react/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { addXp, XP_CONFIG, checkFirstReaction } from '@/lib/gamification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id: announcementId } = params;
    const { reaction } = await req.json();

    if (!reaction) {
        return NextResponse.json({ message: 'La reacción es requerida' }, { status: 400 });
    }

    try {
        const existingReaction = await prisma.announcementReaction.findUnique({
            where: {
                userId_announcementId: {
                    userId: session.id,
                    announcementId,
                }
            }
        });

        if (existingReaction) {
            if (existingReaction.reaction === reaction) {
                await prisma.announcementReaction.delete({
                    where: { id: existingReaction.id }
                });
                return NextResponse.json({ message: 'Reacción eliminada' });
            } else {
                const updatedReaction = await prisma.announcementReaction.update({
                    where: { id: existingReaction.id },
                    data: { reaction },
                });
                return NextResponse.json(updatedReaction);
            }
        } else {
            const newReaction = await prisma.announcementReaction.create({
                data: {
                    userId: session.id,
                    announcementId,
                    reaction,
                },
            });
            
            // --- Gamification ---
            await addXp(session.id, XP_CONFIG.REACT_TO_ANNOUNCEMENT || 1); // Fallback a 1 si no está definido
            await checkFirstReaction(session.id);
            // --------------------

            return NextResponse.json(newReaction, { status: 201 });
        }
    } catch (error) {
        console.error('[ANNOUNCEMENT_REACT_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar la reacción' }, { status: 500 });
    }
}
