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
    
    // CORRECCIÓN: El realtime se debe hacer desde el servidor con el cliente admin, no en el cliente.
    if (supabaseAdmin) {
        const channel = supabaseAdmin.channel(`game:${gameSession.id}`);
        // Se envía un mensaje al canal, pero no se suscribe aquí.
        await channel.send({
            type: 'broadcast',
            event: 'PLAYER_JOINED',
            payload: { id: player.id, nickname: player.nickname, userId: player.userId, score: 0 },
        });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error joining Quizz-IT session:', error);
    return NextResponse.json({ message: 'Error al unirse a la sesión del juego' }, { status: 500 });
  }
}
