// src/app/api/quizz-it/session/[sessionId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  try {
    const gameSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        form: {
          include: {
            fields: {
              where: { type: 'SINGLE_CHOICE' },
              include: { options: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        players: {
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });

    if (!gameSession) {
      return NextResponse.json({ message: 'Sesión de juego no encontrada' }, { status: 404 });
    }

    // Simplificamos los datos para no exponer información sensible
    const response = {
      session: {
        id: gameSession.id,
        pin: gameSession.pin,
        status: gameSession.status,
      },
      form: {
        title: gameSession.form.title,
        fields: gameSession.form.fields.map(field => ({
          id: field.id,
          label: field.label,
          order: field.order,
          options: (field.options as any[]).map(opt => ({
            id: opt.id,
            text: opt.text,
            // No enviar isCorrect al cliente del jugador
          })),
        })),
      },
      players: gameSession.players.map(player => ({
        id: player.id,
        nickname: player.nickname,
        userId: player.userId,
        score: player.score,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching game session:', error);
    return NextResponse.json({ message: 'Error al obtener la sesión del juego' }, { status: 500 });
  }
}
