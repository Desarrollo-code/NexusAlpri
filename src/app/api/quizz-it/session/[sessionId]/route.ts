// src/app/api/quizz-it/session/[sessionId]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { FormFieldOption } from '@/types';

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
        fields: gameSession.form.fields.map(field => {
            // CORRECCIÓN: Prisma devuelve 'options' como un string JSON o un objeto si ya está parseado.
            // Hay que parsearlo para que el frontend lo pueda usar.
            let parsedOptions: FormFieldOption[] = [];
            try {
                if(field.options && typeof field.options === 'string') {
                    parsedOptions = JSON.parse(field.options);
                } else if (Array.isArray(field.options)) {
                    parsedOptions = field.options; // Ya está en el formato correcto
                }
            } catch(e) {
                console.error("Error parsing options for field:", field.id, e);
            }

            return {
              id: field.id,
              label: field.label,
              order: field.order,
              options: parsedOptions.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                // No enviamos 'isCorrect' al cliente del jugador
              })),
            }
        }),
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
