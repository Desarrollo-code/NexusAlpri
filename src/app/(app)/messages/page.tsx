// src/app/(app)/messages/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Mensajería Directa');
  }, [setPageTitle]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle>Próximamente: Un Nuevo Chat</CardTitle>
          <CardDescription>
            Estamos trabajando en una nueva y mejorada experiencia de mensajería para que puedas comunicarte de manera más fluida y eficaz.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
