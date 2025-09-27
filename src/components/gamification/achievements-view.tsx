// src/components/gamification/achievements-view.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AchievementSlug } from '@prisma/client';

interface AchievementData {
  id: string;
  name: string;
  description: string;
  slug: AchievementSlug;
  icon: string | null;
  points: number;
  unlocked: boolean;
  unlockedAt: Date | null;
  progress?: {
    current: number;
    target: number;
  };
}

const AchievementCard = ({ ach }: { ach: AchievementData }) => {
    const isUnlocked = ach.unlocked;
    const progressPercent = ach.progress ? (ach.progress.current / ach.progress.target) * 100 : 0;
    
    // Choose an appropriate icon, defaulting to Award
    const Icon = (LucideIcons as any)[ach.icon || 'Award'] || LucideIcons.Award;

    return (
        <Card className={cn(
            "text-center transition-all duration-300 transform-gpu",
            isUnlocked ? "bg-card border-amber-400/50 shadow-lg" : "bg-muted/50",
            !isUnlocked && progressPercent > 0 && "border-primary/20",
        )}>
            <CardHeader className="items-center pb-4">
                <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center mb-2 transition-colors",
                    isUnlocked ? "bg-amber-400 text-white" : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                   {isUnlocked ? <LucideIcons.Trophy className="h-8 w-8" /> : <LucideIcons.Lock className="h-8 w-8" />}
                </div>
                <CardTitle className="text-base">{ach.name}</CardTitle>
            </CardHeader>
            <CardContent className="h-24 flex flex-col justify-center">
                 <div className="flex justify-center items-center h-8 mb-2">
                   <Icon className={cn("h-7 w-7", isUnlocked ? "text-primary" : "text-muted-foreground/50")} />
                 </div>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
                 {ach.progress && !isUnlocked && (
                    <div className="mt-3 text-left">
                        <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-semibold text-primary">Progreso</span>
                            <span className="text-muted-foreground">{ach.progress.current} / {ach.progress.target}</span>
                        </div>
                        <Progress value={progressPercent} className="h-1.5"/>
                    </div>
                )}
            </CardContent>
            <CardContent className="flex justify-between items-center text-xs p-3 border-t bg-black/5 dark:bg-black/10">
                <span className="font-bold text-primary">{ach.points} XP</span>
                {isUnlocked && ach.unlockedAt && (
                    <span className="text-muted-foreground">
                        {new Date(ach.unlockedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric'})}
                    </span>
                )}
            </CardContent>
        </Card>
    )
}

export function AchievementsView() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/achievements');
      if (!response.ok) {
        throw new Error('No se pudo cargar la lista de logros.');
      }
      const data: AchievementData[] = await response.json();
      setAchievements(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);
  
  const { unlocked, locked } = useMemo(() => {
    const unlockedList = achievements.filter(a => a.unlocked);
    const lockedList = achievements.filter(a => !a.unlocked);
    return { unlocked: unlockedList, locked: lockedList };
  }, [achievements]);


  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-64"/>)}
        </div>
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-64"/>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <LucideIcons.AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Error al Cargar Logros</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Unlocked Achievements */}
        <section>
            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-primary/20">Desbloqueados ({unlocked.length})</h2>
            {unlocked.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {unlocked.map(ach => <AchievementCard key={ach.id} ach={ach} />)}
                 </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">Aún no has desbloqueado ningún logro. ¡Sigue explorando!</p>
            )}
        </section>

         {/* Locked Achievements */}
        <section>
            <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2 border-border">Por Desbloquear ({locked.length})</h2>
             {locked.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {locked.map(ach => <AchievementCard key={ach.id} ach={ach} />)}
                 </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">¡Felicidades! Has desbloqueado todos los logros disponibles.</p>
            )}
        </section>
    </div>
  );
}
