// src/app/(app)/announcements/page.tsx
'use client';

import React, { useEffect, Suspense } from 'react';
import { useTitle } from '@/contexts/title-context';
import { ChatClient } from '@/components/messages/chat-client';
import { Loader2 } from 'lucide-react';

function CommunicationsPageComponent() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Centro de Comunicaciones');
  }, [setPageTitle]);
  
  return (
      <div className="h-[calc(100vh-6rem)]">
          <ChatClient />
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
