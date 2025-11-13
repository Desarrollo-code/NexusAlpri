// src/app/(app)/admin/motivations/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MotivationalMessagesManager } from '@/components/motivations/motivational-messages-manager';
import { useTour } from '@/contexts/tour-context';
import { motivationsTour } from '@/lib/tour-steps';

export default function MotivationsAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const router = useRouter();
  const { startTour } = useTour();

  React.useEffect(() => {
    setPageTitle('Mensajes de Motivación');
    startTour('motivations', motivationsTour);
  }, [setPageTitle, startTour]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR')) {
    router.push('/dashboard');
    return null;
  }
  
  return <MotivationalMessagesManager />;
}

    