// src/app/api/messages/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET a single message by its ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id: messageId } = params;

  try {
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        // Security check: ensure the current user is part of the conversation
        conversation: {
          select: {
            participants: {
              where: {
                id: session.id,
              },
            },
          },
        },
      },
    });

    // If message doesn't exist or user is not a participant
    if (!message || message.conversation.participants.length === 0) {
      return NextResponse.json({ message: 'Mensaje no encontrado o acceso denegado.' }, { status: 404 });
    }
    
    // Remove the conversation details before sending to client
    const { conversation, ...messageToReturn } = message;

    return NextResponse.json(messageToReturn);
  } catch (error) {
    console.error(`[MESSAGE_GET_ERROR]`, error);
    return NextResponse.json({ message: 'Error al obtener el mensaje.' }, { status: 500 });
  }
}
