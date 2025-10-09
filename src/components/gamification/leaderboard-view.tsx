// src/components/gamification/leaderboard-view.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Loader2, AlertTriangle, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface RankedUser {
  rank: number;
  id: string;
  name: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  previousRank?: number;
}

const PodiumCard = ({ user, rank }: { user: RankedUser, rank: number }) => {
    const rankStyles = {
        1: {
            card: "md:order-2 md:scale-110 z-10 shadow-2xl",
            medal: "bg-amber-400 text-amber-900 border-amber-500",
            icon: "text-amber-400 fill-amber-300",
            height: "h-52"
        },
        2: {
            card: "md:order-1",
            medal: "bg-slate-300 text-slate-800 border-slate-400",
            icon: "text-slate-400 fill-slate-300",
            height: "h-44"
        },
        3: {
            card: "md:order-3",
            medal: "bg-orange-400 text-orange-900 border-orange-500",
            icon: "text-orange-400 fill-orange-300",
            height: "h-44"
        },
    };

    const styles = rankStyles[rank as keyof typeof rankStyles];
    
    return (
        <Card className={cn(
            "text-center flex flex-col items-center justify-end p-4 relative overflow-hidden transition-all duration-300 ease-in-out",
            styles.card,
            styles.height
        )}>
             <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent z-0"/>
             <div className="relative z-10 flex flex-col items-center">
                 <div className="relative mb-2">
                     <Avatar className="h-20 w-20 border-4" style={{ borderColor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'}}>
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-2 -right-2 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-background", styles.medal)}>
                        {rank}
                    </div>
                </div>
                <p className="font-bold truncate max-w-[150px]">{user.name}</p>
                <p className="text-xs text-muted-foreground">Nivel {user.level}</p>
                <p className="text-lg font-bold text-primary">{user.xp.toLocaleString()} XP</p>
            </div>
        </Card>
    )
}

export function LeaderboardView() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [leaderboard, setLeaderboard] = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leaderboard');
      if (!response.ok) {
        throw new Error('No se pudo cargar la tabla de clasificación.');
      }
      const data: RankedUser[] = await response.json();
      setLeaderboard(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const currentUserRank = useMemo(() => {
    if (!user) return null;
    return leaderboard.find(u => u.id === user.id);
  }, [user, leaderboard]);

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const restOfLeaderboard = useMemo(() => leaderboard.slice(3), [leaderboard]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <Skeleton className="h-44 rounded-lg md:order-1" />
          <Skeleton className="h-52 rounded-lg md:order-2" />
          <Skeleton className="h-44 rounded-lg md:order-3" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Error al Cargar</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchLeaderboard} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top 3 Podium */}
      {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {topThree[1] && <PodiumCard user={topThree[1]} rank={2} />}
            {topThree[0] && <PodiumCard user={topThree[0]} rank={1} />}
            {topThree[2] && <PodiumCard user={topThree[2]} rank={3} />}
          </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Clasificación General</CardTitle>
          <CardDescription>Top 100 usuarios con más puntos de experiencia (XP).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Posición</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Nivel</TableHead>
                <TableHead className="text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restOfLeaderboard.map((rankedUser) => (
                <TableRow key={rankedUser.id} className={cn(currentUserRank && rankedUser.id === currentUserRank.id && 'bg-primary/10')}>
                  <TableCell className="text-center font-bold text-lg text-muted-foreground">{rankedUser.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={rankedUser.avatar || undefined} />
                        <AvatarFallback><Identicon userId={rankedUser.id}/></AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{rankedUser.name}</p>
                        <p className="text-xs text-muted-foreground">ID: ...{rankedUser.id.slice(-6)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{rankedUser.level}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{rankedUser.xp.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {currentUserRank && (
        <Card className="sticky bottom-4 shadow-2xl bg-gradient-to-r from-primary via-blue-500 to-indigo-600 text-primary-foreground border-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold">#{currentUserRank.rank}</span>
              <Avatar className="h-12 w-12 border-2 border-primary-foreground">
                <AvatarImage src={currentUserRank.avatar || undefined} />
                <AvatarFallback><Identicon userId={currentUserRank.id} /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg">Tú</p>
                <p className="text-sm opacity-80">Nivel {currentUserRank.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{currentUserRank.xp.toLocaleString()} XP</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
