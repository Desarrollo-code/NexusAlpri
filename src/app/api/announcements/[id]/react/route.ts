// src/app/api/announcements/[id]/react/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

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
            // If the same reaction is sent, remove it (toggle off)
            if (existingReaction.reaction === reaction) {
                await prisma.announcementReaction.delete({
                    where: { id: existingReaction.id }
                });
                return NextResponse.json({ message: 'Reacción eliminada' });
            } else {
                // If a different reaction is sent, update it
                const updatedReaction = await prisma.announcementReaction.update({
                    where: { id: existingReaction.id },
                    data: { reaction },
                });
                return NextResponse.json(updatedReaction);
            }
        } else {
            // If no reaction exists, create a new one
            const newReaction = await prisma.announcementReaction.create({
                data: {
                    userId: session.id,
                    announcementId,
                    reaction,
                },
            });
            return NextResponse.json(newReaction, { status: 201 });
        }
    } catch (error) {
        console.error('[ANNOUNCEMENT_REACT_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar la reacción' }, { status: 500 });
    }
}
