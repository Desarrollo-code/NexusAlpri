// src/app/(app)/messages/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useTitle } from '@/contexts/title-context';
import { ChatClient } from '@/components/messages/chat-client';
import { Card } from '@/components/ui/card';

export default function MessagesPage() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Mensajería Directa');
  }, [setPageTitle]);

  return (
    <div className="h-[calc(100vh-8rem)]">
        <ChatClient />
    </div>
  );
}
