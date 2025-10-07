// src/app/api/conversations/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET all conversations for the current user
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: session.id,
          },
        },
      },
      include: {
        participants: {
          where: {
            id: {
              not: session.id, // Exclude the current user from the participants list
            },
          },
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get only the last message for the preview
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error(`[CONVERSATIONS_GET_ERROR]`, error);
    return NextResponse.json({ message: 'Error al obtener las conversaciones.' }, { status: 500 });
  }
}

// POST a new message (and potentially create a new conversation)
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { recipientId, content } = await req.json();

    if (!recipientId || !content) {
      return NextResponse.json({ message: 'Recipient ID y contenido son requeridos.' }, { status: 400 });
    }

    if (recipientId === session.id) {
         return NextResponse.json({ message: 'No puedes enviarte un mensaje a ti mismo.' }, { status: 400 });
    }

    // Find if a conversation already exists between the two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: session.id } } },
          { participants: { some: { id: recipientId } } },
        ],
        // Ensure we don't pick up group chats if they are added later
        participants: {
            every: {
                id: { in: [session.id, recipientId] }
            }
        }
      },
    });

    // If no conversation exists, create one
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: session.id }, { id: recipientId }],
          },
        },
      });
    }

    // Create the new message and update the conversation's updatedAt timestamp
    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          authorId: session.id,
          conversationId: conversation.id,
        },
        include: {
            author: {
                select: { id: true, name: true, avatar: true }
            }
        }
      }),
      prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
      })
    ]);

    // TODO: Implement real-time notifications (e.g., via WebSockets/Pusher)

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ message: 'El usuario destinatario no existe.' }, { status: 404 });
    }
    console.error(`[MESSAGE_POST_ERROR]`, error);
    return NextResponse.json({ message: 'Error al enviar el mensaje.' }, { status: 500 });
  }
}
