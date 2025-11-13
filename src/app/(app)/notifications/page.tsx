// src/app/(app)/notifications/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useTitle } from '@/contexts/title-context';
import { NotificationsView } from '@/components/announcements/notifications-view';
import { Card } from '@/components/ui/card';
import { useTour } from '@/contexts/tour-context';
import { notificationsTour } from '@/lib/tour-steps';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export default function NotificationsPage() {
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();

  useEffect(() => {
    setPageTitle('Notificaciones');
    startTour('notifications', notificationsTour);
  }, [setPageTitle, startTour]);

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Bandeja de Entrada</h1>
            <p className="text-muted-foreground">Revisa tus notificaciones personales, desde asignaciones hasta logros.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => forceStartTour('notifications', notificationsTour)}>
            <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
          </Button>
       </div>
      <Card id="notifications-list">
        <NotificationsView />
      </Card>
    </div>
  );
}

    