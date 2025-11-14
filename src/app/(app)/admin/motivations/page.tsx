// src/app/(app)/admin/motivations/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { MotivationalMessagesManager } from '@/components/motivations/motivational-messages-manager';
import { useTour } from '@/contexts/tour-context';
import { motivationsTour } from '@/lib/tour-steps';
import { Skeleton } from '@/components/ui/skeleton';

const MotivationsSkeleton = () => (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <Skeleton className="h-8 w-80" />
                <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            ))}
        </div>
    </div>
);


export default function MotivationsAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const router = useRouter();
  const { startTour } = useTour();
  const [showSkeleton, setShowSkeleton] = useState(true);

  React.useEffect(() => {
    setPageTitle('Mensajes de Motivación');
    startTour('motivations', motivationsTour);
  }, [setPageTitle, startTour]);

  // Sincronizar el esqueleto con la carga de autenticación y datos
  useEffect(() => {
    if (!isAuthLoading) {
      // Un pequeño retraso para permitir que el componente hijo empiece a cargar
      const timer = setTimeout(() => setShowSkeleton(false), 50); 
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading]);

  if (isAuthLoading || showSkeleton) {
    return <MotivationsSkeleton />;
  }

  if (!user || (user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR')) {
    router.push('/dashboard');
    return null;
  }
  
  return <MotivationalMessagesManager />;
}
