// src/app/(app)/messages/page.tsx
'use client';

import { ChatClient } from '@/components/messages/chat-client';
import { useTitle } from '@/contexts/title-context';
import React, { useEffect } from 'react';

export default function MessagesPage() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Mensajería Directa');
  }, [setPageTitle]);

  return <ChatClient />;
}
