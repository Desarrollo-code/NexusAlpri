// src/app/api/quizz-it/join/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-client';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'Debes iniciar sesión para unirte a un juego.' }, { status: 401 });
  }
  
  if (!supabaseAdmin) {
      return NextResponse.json({ message: "Servicio de tiempo real no configurado." }, { status: 500 });
  }

  try {
    const { pin, nickname } = await req.json();

    const gameSession = await prisma.gameSession.findUnique({
      where: { pin },
    });

    if (!gameSession || gameSession.status !== 'LOBBY') {
      return NextResponse.json({ message: 'PIN de juego inválido o el juego ya ha comenzado.' }, { status: 404 });
    }

    const existingPlayer = await prisma.player.findFirst({
        where: {
            userId: session.id,
            gameSessionId: gameSession.id
        }
    });

    if (existingPlayer) {
        return NextResponse.json(existingPlayer);
    }
    
    const player = await prisma.player.create({
      data: {
        userId: session.id,
        gameSessionId: gameSession.id,
        nickname,
      },
    });
    
    // El servidor ahora es responsable de enviar el evento de "jugador unido"
    const channelName = `game:${gameSession.id}`;
    const broadcastPayload = {
      event: 'game_event',
      payload: { event: 'PLAYER_JOINED', payload: { id: player.id, nickname: player.nickname, userId: player.userId, score: 0 } },
    };
    
    const { error } = await supabaseAdmin.from('RealtimeMessage').insert({
        channel: channelName,
        event: broadcastPayload.event,
        payload: broadcastPayload.payload,
    });

    if (error) {
        console.error("Supabase broadcast error on join:", error);
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error joining Quizz-IT session:', error);
    return NextResponse.json({ message: 'Error al unirse a la sesión del juego' }, { status: 500 });
  }
}
