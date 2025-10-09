// src/hooks/use-realtime-chat.ts
import { useEffect, useRef } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-client';
import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook para suscribirse a eventos de broadcast en tiempo real para un canal específico.
 * @param channelName - El nombre del canal al que suscribirse (ej. "chat:123" o "game:456").
 * @param onNewEvent - Callback que se ejecuta cuando se recibe un nuevo evento de broadcast.
 */
export function useRealtime(
  channelName: string | null,
  onNewEvent: (payload: { event: string, payload: any }) => void
) {
  const onNewEventRef = useRef(onNewEvent);
  onNewEventRef.current = onNewEvent;

  useEffect(() => {
    if (!channelName || !supabaseBrowserClient) {
        return;
    }
    
    let channel: RealtimeChannel;

    const handleIncomingEvent = (payload: { event: string, payload: any }) => {
      onNewEventRef.current(payload);
    };

    // Usamos el mismo canal para enviar y recibir, pero con un nombre de evento específico
    // para los mensajes que este cliente debe procesar.
    channel = supabaseBrowserClient.channel(channelName, {
        config: {
            broadcast: {
                self: false, // No recibir los propios mensajes
            },
        },
    });

    channel
      .on('broadcast', { event: 'game_event' }, (payload) => {
          handleIncomingEvent(payload.payload); // El payload anidado contiene nuestro evento y datos.
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Conectado al canal en tiempo real: ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`Error en el canal ${channelName}:`, err);
        }
      });
      
    return () => {
      if (channel) {
        console.log(`Desconectando del canal: ${channelName}`);
        supabaseBrowserClient.removeChannel(channel);
      }
    };
  }, [channelName]);
}
