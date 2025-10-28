// src/app/(app)/announcements/page.tsx
'use client';

import React, { useEffect, Suspense, useState } from 'react';
import { useTitle } from '@/contexts/title-context';
import { ChatClient } from '@/components/messages/chat-client';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { NotificationsView } from '@/components/announcements/notifications-view';
import { AnnouncementsView } from '@/components/announcements/announcements-view';
import type { Announcement as AnnouncementType, Conversation as AppConversation } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

function CommunicationsPageComponent() {
  const { setPageTitle } = useTitle();
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setPageTitle('Centro de Comunicaciones');
  }, [setPageTitle]);
  
  const handleSelect = (item: AppConversation | AnnouncementType, type: 'conversation' | 'announcement') => {
      setActiveItem({ type, data: item });
  }

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  }
  
  const contentVariants = {
    open: { display: "block" },
    closed: { display: "none" },
  }

  // En móvil, la vista de chat ocupa toda la pantalla
  if (isMobile) {
      return (
          <div className="relative h-[calc(100vh-6rem)] overflow-hidden">
               <motion.div
                    variants={sidebarVariants}
                    initial="open"
                    animate={activeItem ? "closed" : "open"}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                    className="absolute inset-0 w-full h-full"
                >
                  <div className="h-full flex flex-col gap-4 p-2">
                    <Card className="flex-1 flex flex-col">
                        <NotificationsView />
                    </Card>
                    <Card className="flex-1 flex flex-col">
                        <AnnouncementsView onSelect={(item) => handleSelect(item, 'announcement')} selectedId={activeItem?.type === 'announcement' ? activeItem.data.id : null}/>
                    </Card>
                  </div>
              </motion.div>
              <AnimatePresence>
              {activeItem && (
                  <motion.div
                      key="chat-content"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                      className="absolute inset-0 w-full h-full bg-background"
                  >
                      <ChatClient 
                          activeItem={activeItem} 
                          onBack={() => setActiveItem(null)} 
                          onSelectConversation={(c) => handleSelect(c, 'conversation')}
                      />
                  </motion.div>
              )}
              </AnimatePresence>
          </div>
      )
  }

  return (
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr] gap-6 h-[calc(100vh-8rem)]">
          {/* Columna Izquierda */}
          <div className="flex flex-col gap-6 h-full">
              <Card className="flex-1 flex flex-col min-h-0">
                  <NotificationsView />
              </Card>
              <Card className="flex-1 flex flex-col min-h-0">
                  <AnnouncementsView onSelect={(item) => handleSelect(item, 'announcement')} selectedId={activeItem?.type === 'announcement' ? activeItem.data.id : null} />
              </Card>
          </div>
          {/* Columna Derecha */}
          <div className="h-full">
              <ChatClient 
                  activeItem={activeItem}
                  onSelectConversation={(c) => handleSelect(c, 'conversation')}
                  onBack={() => setActiveItem(null)}
              />
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
