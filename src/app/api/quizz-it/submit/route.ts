// src/app/api/quizz-it/submit/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-client';
import type { FormFieldOption } from '@/types';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { sessionId, questionId, optionId, responseTimeMs } = await req.json();

    const player = await prisma.player.findFirst({
      where: { userId: session.id, gameSessionId: sessionId },
    });

    if (!player) {
      return NextResponse.json({ message: 'Jugador no encontrado en esta sesión' }, { status: 404 });
    }

    const question = await prisma.formField.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    if (!question) {
      return NextResponse.json({ message: 'Pregunta no encontrada' }, { status: 404 });
    }

    const selectedOption = (question.options as unknown as FormFieldOption[]).find(opt => opt.id === optionId);
    const isCorrect = selectedOption?.isCorrect || false;

    // --- Lógica de Puntuación ---
    let scoreAwarded = 0;
    if (isCorrect) {
        const timeLimit = 20000; // 20 segundos por pregunta
        const speedBonus = Math.max(0, 1000 * (1 - (responseTimeMs / timeLimit) / 2));
        scoreAwarded = Math.round(1000 + speedBonus);
    }
    // ----------------------------

    const updatedPlayer = await prisma.player.update({
      where: { id: player.id },
      data: { score: { increment: scoreAwarded } },
    });

    const response = await prisma.playerResponse.create({
      data: {
        playerId: player.id,
        questionId,
        optionId,
        isCorrect,
        scoreAwarded,
        responseTimeMs,
      },
    });

    if (supabaseAdmin) {
        const channel = supabaseAdmin.channel(`game:${sessionId}`);
        await channel.send({
            type: 'broadcast',
            event: 'PLAYER_ANSWERED',
            payload: { userId: session.id, nickname: player.nickname },
        });
    }

    return NextResponse.json({
      isCorrect,
      scoreAwarded,
      newTotalScore: updatedPlayer.score,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({ message: 'Error al enviar la respuesta' }, { status: 500 });
  }
}
