// src/app/(app)/messages/page.tsx
'use client';

import React, { useEffect, Suspense, useState } from 'react';
import { useTitle } from '@/contexts/title-context';
import { ChatClient } from '@/components/messages/chat-client';
import { Loader2 } from 'lucide-react';
import type { Conversation as AppConversation, Announcement as AnnouncementType } from '@/types';

function MessagesPageComponent() {
  const { setPageTitle } = useTitle();
  const [activeItem, setActiveItem] = useState<any | null>(null);

  useEffect(() => {
    setPageTitle('Mensajería Directa');
  }, [setPageTitle]);

  const handleSelectConversation = (c: AppConversation) => {
    setActiveItem({ type: 'conversation', data: c });
  };
  
  const handleSelectAnnouncement = (a: AnnouncementType) => {
    setActiveItem({ type: 'announcement', data: a });
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
        <ChatClient 
          activeItem={activeItem}
          onSelectConversation={handleSelectConversation}
          onBack={() => setActiveItem(null)}
        />
    </div>
  );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MessagesPageComponent />
        </Suspense>
    )
}
