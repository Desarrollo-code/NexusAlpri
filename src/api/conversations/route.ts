// src/app/api/conversations/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { supabaseAdmin } from '@/lib/supabase-client';

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
          include: {
            attachments: true, // Incluir adjuntos del último mensaje
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
    const { recipientId, content, attachments } = await req.json();

    if (!recipientId || (!content?.trim() && (!attachments || attachments.length === 0))) {
      return NextResponse.json({ message: 'Se requiere destinatario y contenido o al menos un adjunto.' }, { status: 400 });
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
          { participants: { count: 2 } } // Ensure it's a 1-on-1 chat
        ]
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

    // --- CORRECCIÓN: Preparar el payload del mensaje ANTES de la transacción ---
    const messagePayloadForRT = {
        content: content || null,
        authorId: session.id,
        conversationId: conversation.id,
        createdAt: new Date().toISOString(),
        author: {
            id: session.id,
            name: session.name,
            avatar: session.avatar,
        },
        attachments: attachments || [],
    };


    // Create the new message and update the conversation's updatedAt timestamp
    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          content: content || null,
          authorId: session.id,
          conversationId: conversation.id,
          attachments: attachments && attachments.length > 0 ? {
            create: attachments.map((att: any) => ({
              name: att.name,
              url: att.url,
              type: att.type,
              size: att.size,
            }))
          } : undefined
        },
        include: {
            author: {
                select: { id: true, name: true, avatar: true }
            },
            attachments: true,
        }
      }),
      prisma.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() }
      })
    ]);

    // Send real-time notification to the recipient
    if (supabaseAdmin) {
        const channelName = `user:${recipientId}`;
        
        const broadcastPayload = {
            event: 'chat_message',
            payload: {
                ...newMessage,
                author: messagePayloadForRT.author, // Ensure author data is included
            },
        };

        const channel = supabaseAdmin.channel(channelName);
        const status = await channel.send({
            type: 'broadcast',
            event: broadcastPayload.event,
            payload: broadcastPayload.payload,
        });

        if (status !== 'ok') {
            console.error("Supabase broadcast error:", status);
        }
    }

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ message: 'El usuario destinatario no existe.' }, { status: 404 });
    }
    console.error(`[MESSAGE_POST_ERROR]`, error);
    return NextResponse.json({ message: 'Error al enviar el mensaje.' }, { status: 500 });
  }
}
