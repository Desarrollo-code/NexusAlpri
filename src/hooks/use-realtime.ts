// src/hooks/use-realtime.ts
import { useEffect, useRef, useCallback } from 'react';
import { supabaseBrowserClient } from '@/lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook para suscribirse a eventos de broadcast en tiempo real para un canal específico.
 * @param channelName - El nombre del canal al que suscribirse (ej. "chat:123" o "game:456").
 * @param onNewEvent - Callback que se ejecuta cuando se recibe un nuevo evento de broadcast.
 */
export function useRealtime(
  channelName: string | null,
  onNewEvent: (payload: any) => void // Aceptamos un payload genérico
) {
  const onNewEventRef = useRef(onNewEvent);
  onNewEventRef.current = onNewEvent;

  useEffect(() => {
    if (!channelName || !supabaseBrowserClient) {
        return;
    }
    
    let channel: RealtimeChannel;

    const handleIncomingEvent = (payload: any) => {
      onNewEventRef.current(payload);
    };

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
      .on('broadcast', { event: 'chat_message' }, (payload) => {
          handleIncomingEvent(payload.payload); // Para el chat, el payload directo es el mensaje
      })
      .on('broadcast', { event: 'announcement_updated' }, handleIncomingEvent)
      .on('broadcast', { event: 'announcement_deleted' }, handleIncomingEvent)
      .on('broadcast', { event: 'course_deleted' }, handleIncomingEvent)
      .on('broadcast', { event: 'form_deleted' }, handleIncomingEvent)
      .on('broadcast', { event: 'event_deleted' }, handleIncomingEvent)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // console.log(`Conectado al canal en tiempo real: ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`Error en el canal ${channelName}:`, err);
        }
      });
      
    return () => {
      if (channel) {
        // console.log(`Desconectando del canal: ${channelName}`);
        supabaseBrowserClient.removeChannel(channel);
      }
    };
  }, [channelName]);
}
