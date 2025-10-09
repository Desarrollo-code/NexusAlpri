// src/app/(app)/leaderboard/page.tsx
'use client';
import { LeaderboardView } from '@/components/gamification/leaderboard-view';
import { useTitle } from '@/contexts/title-context';
import { HelpCircle } from 'lucide-react';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTour } from '@/contexts/tour-context';

export default function LeaderboardPage() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Ranking de Competencia');
  }, [setPageTitle]);
  
  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Tabla de Clasificación</h1>
                <p className="text-muted-foreground">Compite y mira quién lidera la plataforma en puntos de experiencia (XP).</p>
            </div>
        </div>
        <LeaderboardView />
    </div>
  );
}
