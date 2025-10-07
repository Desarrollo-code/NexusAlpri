// src/hooks/use-realtime-chat.ts
import { useEffect, useRef } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message } from '@/types';

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
      // CORRECCIÓN: El payload 'new' ya contiene los datos del mensaje.
      // No necesitamos hacer un fetch adicional.
      if (payload.eventType === 'INSERT') {
        const newMessageData = payload.new;
        
        // Ahora, necesitamos obtener los datos del autor. Hacemos una consulta rápida y eficiente.
        try {
            const { data: authorData, error } = await supabaseBrowserClient
                .from('User')
                .select('id, name, avatar')
                .eq('id', newMessageData.authorId)
                .single();

            if (error) throw error;
            
            // Construimos el objeto `Message` completo que espera la UI.
            const fullMessage: Message = {
                id: newMessageData.id,
                content: newMessageData.content,
                createdAt: newMessageData.createdAt,
                authorId: newMessageData.authorId,
                author: {
                    id: authorData.id,
                    name: authorData.name,
                    avatar: authorData.avatar,
                }
            };
            onNewMessageRef.current(fullMessage);
        } catch (e) {
            console.error("Error fetching author for new message:", e);
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
