// src/app/(app)/notifications/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useTitle } from '@/contexts/title-context';
import { NotificationsView } from '@/components/announcements/notifications-view';
import { Card } from '@/components/ui/card';

export default function NotificationsPage() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Notificaciones');
  }, [setPageTitle]);

  return (
    <Card>
      <NotificationsView />
    </Card>
  );
}
