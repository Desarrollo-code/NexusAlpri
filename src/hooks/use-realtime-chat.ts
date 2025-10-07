// src/hooks/use-realtime-chat.ts
import { useEffect, useRef } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message } from '@/types';
import prisma from '@/lib/prisma';

/**
 * Hook para suscribirse a mensajes en tiempo real para una conversación específica.
 * @param conversationId - El ID de la conversación a la que suscribirse.
 * @param onNewMessage - Callback que se ejecuta cuando se recibe un nuevo mensaje.
 */
export function useRealtimeChat(
  conversationId: string | null,
  onNewMessage: (newMessage: Message) => void
) {
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    if (!conversationId || conversationId.startsWith('temp-')) {
        return;
    }
    
    const handleNewMessagePayload = async (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      if (payload.eventType === 'INSERT') {
        const newMessageId = payload.new.id;
        
        // El payload de realtime solo trae el ID, necesitamos obtener los detalles.
        try {
            // Se usa una nueva llamada a la API para esto, ya que el hook está en el cliente.
            // O podemos crear un endpoint específico para obtener un solo mensaje.
            // Para simplicidad, por ahora asumimos que podríamos necesitar un fetch.
            // Pero idealmente, si el payload tuviera todo, no sería necesario.
            // Nota: Por seguridad y eficiencia, lo ideal es tener un API route para esto.
            // Por ahora, simularemos la obtención de detalles.
            const res = await fetch(`/api/messages/${newMessageId}`);
            if(res.ok) {
                const fullMessage: Message = await res.json();
                onNewMessageRef.current(fullMessage);
            }
        } catch(e) {
            console.error("Error fetching full new message:", e);
        }
      }
    };

    const channel = supabaseBrowserClient.channel(`chat_room:${conversationId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversationId}`,
        },
        handleNewMessagePayload
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Conectado al canal de chat: ${conversationId}`);
        }
      });
      
    // La función de limpieza se ejecuta cuando el componente se desmonta o el conversationId cambia.
    return () => {
      console.log(`Desconectando del canal de chat: ${conversationId}`);
      supabaseBrowserClient.removeChannel(channel);
    };
  }, [conversationId]);
}
