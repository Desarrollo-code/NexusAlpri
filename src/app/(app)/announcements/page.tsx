// src/app/(app)/announcements/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Announcement as AnnouncementType, UserRole } from '@/types'; 
import { PlusCircle, Megaphone, Loader2, AlertTriangle, Paperclip } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { AnnouncementCreator } from '@/components/announcements/announcement-creator';
import { AnnouncementsView } from '@/components/announcements/announcements-view';
import { NotificationsView } from '@/components/announcements/notifications-view';

export default function CommunicationsPage() {
  const { user, settings } = useAuth();
  const { setPageTitle } = useTitle();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // El estado de la pestaña ahora determina qué se muestra.
  // 'announcements' o 'notifications'
  const activeTab = searchParams.get('tab') || 'announcements';

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [updateSignal, setUpdateSignal] = useState(0);

  useEffect(() => {
    setPageTitle('Comunicaciones');
  }, [setPageTitle]);
  
  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  const handleAnnouncementCreated = () => {
    // Forzar una actualización de la vista de anuncios
    setUpdateSignal(prev => prev + 1);
    setIsCreatorOpen(false);
  }

  const canCreate = user?.role === 'ADMINISTRATOR' || user?.role === 'INSTRUCTOR';

  return (
    <div className="relative flex-1">
        <div 
            className="absolute inset-0 -z-10 bg-cover bg-center" 
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${settings?.announcementsImageUrl || ''}')`,
            }}
        />
        <div className="relative z-10 p-4 md:p-8">
            <main className="max-w-2xl mx-auto">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                        <TabsList className="bg-background/20 backdrop-blur-sm">
                            <TabsTrigger value="announcements">Anuncios</TabsTrigger>
                            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
                        </TabsList>
                        {activeTab === 'announcements' && canCreate && (
                            <Button className="w-full sm:w-auto" onClick={() => setIsCreatorOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4"/>Crear Anuncio
                            </Button>
                        )}
                    </div>
                    <TabsContent value="announcements">
                        <AnnouncementsView key={`announcements-${updateSignal}`} />
                    </TabsContent>
                    <TabsContent value="notifications">
                        <NotificationsView />
                    </TabsContent>
                </Tabs>

                {canCreate && (
                  <AnnouncementCreator
                    isOpen={isCreatorOpen}
                    onClose={() => setIsCreatorOpen(false)}
                    onAnnouncementCreated={handleAnnouncementCreated}
                  />
                )}
            </main>
      </div>
    </div>
  );
}
