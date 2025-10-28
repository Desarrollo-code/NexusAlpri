// src/app/(app)/messages/page.tsx
'use client';

import React, { useEffect, Suspense } from 'react';
import { useTitle } from '@/contexts/title-context';
import { ChatClient } from '@/components/messages/chat-client';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function MessagesPageComponent() {
  const { setPageTitle } = useTitle();
  const searchParams = useSearchParams();
  const newChatUserId = searchParams.get('new');

  useEffect(() => {
    setPageTitle('Centro de Comunicaciones');
  }, [setPageTitle]);

  return (
    <div className="h-[calc(100vh-5.1rem)]">
      <ChatClient newChatUserId={newChatUserId} />
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
