// src/app/(app)/leaderboard/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { Trophy, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardView } from '@/components/gamification/leaderboard-view';
import { AchievementsView } from '@/components/gamification/achievements-view';


export default function ProgressAndRankingPage() {
  const { user } = useAuth();
  const { setPageTitle } = useTitle();

  React.useEffect(() => {
    setPageTitle('Progreso y Ranking');
  }, [setPageTitle]);
  
  if(!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-400" />
          Progreso y Ranking
        </h1>
        <p className="text-muted-foreground">Compite, aprende, desbloquea logros y alcanza la cima.</p>
      </div>

       <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="leaderboard"><Trophy className="mr-2 h-4 w-4"/>Ranking General</TabsTrigger>
                <TabsTrigger value="achievements"><Award className="mr-2 h-4 w-4"/>Mis Logros</TabsTrigger>
            </TabsList>
            <TabsContent value="leaderboard" className="mt-6">
                <LeaderboardView />
            </TabsContent>
            <TabsContent value="achievements" className="mt-6">
                <AchievementsView />
            </TabsContent>
        </Tabs>
      
    </div>
  );
}
