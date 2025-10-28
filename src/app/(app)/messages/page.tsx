// src/app/(app)/messages/page.tsx
'use client';

import React, { useEffect, Suspense } from 'react';
import { useTitle } from '@/contexts/title-context';
import { ChatClient } from '@/components/messages/chat-client';
import { Loader2 } from 'lucide-react';

function MessagesPageComponent() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Mensajería Directa');
  }, [setPageTitle]);

  return (
    <div className="h-[calc(100vh-6rem)]">
        <ChatClient />
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
