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
    
    // SAFE MAPPING to prevent server errors on null content
    const safeConversations = conversations.map(c => {
      const lastMessage = c.messages[0];
      let lastMessageText = 'Conversación iniciada';
      
      if (lastMessage) {
        if (lastMessage.content) {
          lastMessageText = lastMessage.content;
        } else if (lastMessage.attachments?.length > 0) {
          lastMessageText = `Envió un adjunto`;
        }
      }

      return {
        ...c,
        messages: lastMessage ? [{ ...lastMessage, content: lastMessageText }] : [],
      }
    });

    return NextResponse.json(safeConversations);
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

    // Find if a 1-on-1 conversation already exists between the two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: session.id } } },
          { participants: { some: { id: recipientId } } },
          { isGroup: false }
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
          isGroup: false,
        },
      });
    }

    // --- Message sending logic ---
    const [newMessage, _] = await prisma.$transaction([
        prisma.message.create({
            data: {
              content: content || null,
              authorId: session.id,
              conversationId: conversation.id,
              isRead: false,
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
                author: { select: { id: true, name: true, avatar: true } },
                attachments: true,
            }
        }),
        prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        })
    ]);


    // Send real-time notification to the recipient
    if (supabaseAdmin && newMessage) {
        // Prepare a safe payload for broadcasting, excluding sensitive or complex objects
        const authorPayload = {
            id: newMessage.author.id,
            name: newMessage.author.name,
            avatar: newMessage.author.avatar,
        };

        const finalMessageForBroadcast = {
            ...newMessage,
            author: authorPayload // Use the safe payload
        };
        
        const channelName = `user:${recipientId}`;
        const broadcastPayload = {
            event: 'chat_message',
            payload: finalMessageForBroadcast,
        };

        const { error } = await supabaseAdmin.from('RealtimeMessage').insert({
            channel: channelName,
            event: broadcastPayload.event,
            payload: broadcastPayload.payload,
        });

        if (error) {
            console.error("Supabase broadcast error:", error);
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
