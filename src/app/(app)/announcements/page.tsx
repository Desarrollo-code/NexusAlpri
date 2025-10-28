// src/app/(app)/announcements/page.tsx
'use client';

import React, { useEffect, Suspense, useState, useCallback } from 'react';
import { useTitle } from '@/contexts/title-context';
import { ChatClient } from '@/components/messages/chat-client';
import { Loader2, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { NotificationsView } from '@/components/announcements/notifications-view';
import { AnnouncementsView } from '@/components/announcements/announcements-view';
import type { Announcement as AnnouncementType, Conversation as AppConversation } from '@/types';

function CommunicationsPageComponent() {
  const { setPageTitle } = useTitle();
  const [activeConversation, setActiveConversation] = useState<AppConversation | null>(null);

  useEffect(() => {
    setPageTitle('Centro de Comunicaciones');
  }, [setPageTitle]);
  
  const handleSelectConversation = useCallback((conversation: AppConversation) => {
      setActiveConversation(conversation);
  }, []);

  return (
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[320px_1fr_300px] gap-6 h-[calc(100vh-8rem)]">
          {/* Columna Izquierda (Chats) - Oculta en móvil si hay una conversación activa */}
          <div className="hidden md:flex flex-col h-full">
              <ChatClient 
                  onSelectConversation={handleSelectConversation}
                  activeConversationId={activeConversation?.id || null}
              />
          </div>
          
          {/* Columna Central (Área de Mensajes) */}
          <div className="h-full">
              {activeConversation ? (
                   <div className="flex flex-col h-full bg-card rounded-lg border">
                       {/* Aquí iría el MessageArea, por ahora simulado */}
                        <div className="p-4 border-b">
                            <h3 className="font-semibold">{activeConversation.participants[0]?.name}</h3>
                        </div>
                        <div className="flex-1 p-4">Historial de chat para {activeConversation.participants[0]?.name}</div>
                        <div className="p-4 border-t">Campo de texto</div>
                   </div>
              ) : (
                  <div className="hidden md:flex flex-col h-full items-center justify-center text-muted-foreground bg-card rounded-lg border p-8 text-center">
                      <MessageSquare className="h-16 w-16 mb-4"/>
                      <h3 className="text-lg font-semibold">Selecciona una conversación</h3>
                      <p className="text-sm">O inicia una nueva para empezar a chatear.</p>
                  </div>
              )}
          </div>
          
          {/* Columna Derecha (Notificaciones y Anuncios) */}
          <div className="hidden lg:flex flex-col gap-6 h-full">
              <Card className="flex-1 flex flex-col min-h-0">
                  <NotificationsView />
              </Card>
              <Card className="flex-1 flex flex-col min-h-0">
                  <AnnouncementsView />
              </Card>
          </div>
      </div>
  );
}

export default function CommunicationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <CommunicationsPageComponent />
        </Suspense>
    )
}
