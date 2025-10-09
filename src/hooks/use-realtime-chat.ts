// src/hooks/use-realtime-chat.ts
import { useEffect, useRef } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message } from '@/types';

/**
 * Hook para suscribirse a eventos en tiempo real para una conversación o juego.
 * @param channelName - El nombre del canal al que suscribirse (ej. "chat:123" o "game:456").
 * @param onNewEvent - Callback que se ejecuta cuando se recibe un nuevo evento.
 */
export function useRealtime(
  channelName: string | null,
  onNewEvent: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void
) {
  const onNewEventRef = useRef(onNewEvent);
  onNewEventRef.current = onNewEvent;

  useEffect(() => {
    if (!channelName || !supabaseBrowserClient) {
        return;
    }
    
    const handleIncomingEvent = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      onNewEventRef.current(payload);
    };

    const channel = supabaseBrowserClient.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar cualquier evento (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'RealtimeMessage',
          filter: `channel=eq.${channelName}`, // Filtrar mensajes para este canal específico
        },
        handleIncomingEvent
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Conectado al canal en tiempo real: ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`Error en el canal ${channelName}:`, err);
        }
      });
      
    // La función de limpieza se ejecuta cuando el componente se desmonta o el channelName cambia.
    return () => {
      if (channel) {
        console.log(`Desconectando del canal: ${channelName}`);
        supabaseBrowserClient.removeChannel(channel);
      }
    };
  }, [channelName]);
}
