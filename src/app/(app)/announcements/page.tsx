// src/app/(app)/announcements/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { AnnouncementCreator } from '@/components/announcements/announcement-creator';
import { AnnouncementsView } from '@/components/announcements/announcements-view';
import { NotificationsView } from '@/components/announcements/notifications-view';
import { ChatClient } from '@/components/messages/chat-client';
import { Card } from '@/components/ui/card';

function CommunicationsPageComponent() {
  const { user } = useAuth();
  const { setPageTitle } = useTitle();

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [updateSignal, setUpdateSignal] = useState(0);

  useEffect(() => {
    setPageTitle('Centro de Comunicaciones');
  }, [setPageTitle]);
  
  const handleAnnouncementCreated = () => {
    setUpdateSignal(prev => prev + 1);
    setIsCreatorOpen(false);
  }

  const canCreate = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <header className="flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline">Centro de Comunicaciones</h1>
            <p className="text-muted-foreground">Tu espacio central para notificaciones, mensajes y anuncios.</p>
          </div>
          {canCreate && (
             <Button onClick={() => setIsCreatorOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/>Crear Anuncio
            </Button>
          )}
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-grow min-h-0">
        {/* Notificaciones */}
        <Card className="hidden lg:block lg:col-span-1 xl:col-span-1 flex-col">
          <NotificationsView />
        </Card>

        {/* Mensajes */}
        <div className="lg:col-span-2 xl:col-span-3 h-full min-h-0">
          <ChatClient />
        </div>

        {/* Anuncios */}
        <Card className="hidden xl:block xl:col-span-1 flex-col overflow-y-auto thin-scrollbar">
           <div className="p-4 border-b">
              <h3 className="font-semibold">Anuncios Globales</h3>
           </div>
           <div className="p-2">
             <AnnouncementsView key={`announcements-${updateSignal}`} />
           </div>
        </Card>
      </main>

       {canCreate && (
          <AnnouncementCreator
            isOpen={isCreatorOpen}
            onClose={() => setIsCreatorOpen(false)}
            onAnnouncementCreated={handleAnnouncementCreated}
          />
        )}
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
