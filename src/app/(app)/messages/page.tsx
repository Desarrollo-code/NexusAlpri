// src/app/(app)/messages/page.tsx
'use client';

import { ChatClient } from '@/components/messages/chat-client';
import { useTitle } from '@/contexts/title-context';
import React, { useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function MessagesPageComponent() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Mensajería Directa');
  }, [setPageTitle]);

  return <ChatClient />;
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MessagesPageComponent />
        </Suspense>
    )
}
