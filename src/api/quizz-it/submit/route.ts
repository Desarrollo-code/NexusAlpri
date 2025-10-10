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

  if (!supabaseAdmin) {
      return NextResponse.json({ message: "Servicio de tiempo real no configurado." }, { status: 500 });
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
    });

    if (!question) {
      return NextResponse.json({ message: 'Pregunta no encontrada' }, { status: 404 });
    }

    const options = question.options as unknown as FormFieldOption[];
    const selectedOption = options.find(opt => opt.id === optionId);
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

    // El servidor notifica a todos que este jugador ha respondido
    const channelName = `game:${sessionId}`;
    const broadcastPayload = {
      event: 'game_event',
      payload: { event: 'PLAYER_ANSWERED', payload: { userId: session.id, nickname: player.nickname } },
    };

    const channel = supabaseAdmin.channel(channelName);
    const status = await channel.send({
      type: 'broadcast',
      event: broadcastPayload.event,
      payload: broadcastPayload.payload
    });
    
    if (status !== 'ok') {
        console.error("Supabase broadcast error on answer:", status);
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
