
// src/app/(app)/leaderboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTitle } from '@/contexts/title-context';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Loader2, AlertTriangle, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface RankedUser {
  rank: number;
  id: string;
  name: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  previousRank?: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { setPageTitle } = useTitle();
  const { toast } = useToast();

  const [leaderboard, setLeaderboard] = useState<RankedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Ranking de la Plataforma');
  }, [setPageTitle]);

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

  const RankIndicator = ({ user }: { user: RankedUser }) => {
    if (!user.previousRank) return <span className="w-4 h-4" />;
    
    if (user.rank < user.previousRank) {
        return <ChevronUp className="h-4 w-4 text-green-500" />;
    }
    if (user.rank > user.previousRank) {
        return <ChevronDown className="h-4 w-4 text-destructive" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
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
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-400" />
          Ranking General
        </h1>
        <p className="text-muted-foreground">¡Compite, aprende y alcanza la cima!</p>
      </div>
      
      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {topThree.length > 1 && (
          <PodiumCard user={topThree[1]} rank={2} />
        )}
        {topThree.length > 0 && (
          <PodiumCard user={topThree[0]} rank={1} />
        )}
        {topThree.length > 2 && (
          <PodiumCard user={topThree[2]} rank={3} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de Clasificación</CardTitle>
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
              {restOfLeaderboard.map((rankedUser, index) => (
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
        <Card className="sticky bottom-4 shadow-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
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

const PodiumCard = ({ user, rank }: { user: RankedUser, rank: number }) => {
    const medalColors = {
        1: "bg-amber-400 text-amber-900 border-amber-500",
        2: "bg-slate-300 text-slate-800 border-slate-400",
        3: "bg-orange-400 text-orange-900 border-orange-500",
    };
    const cardHeight = {
        1: "h-48",
        2: "h-40",
        3: "h-40",
    }
    const cardOrder = {
        1: "md:order-2",
        2: "md:order-1",
        3: "md:order-3",
    }
    return (
        <Card className={cn("text-center flex flex-col items-center justify-center p-4 relative overflow-hidden", cardOrder[rank], cardHeight[rank])}>
            <div className={cn("absolute top-0 right-0 h-16 w-16 text-center leading-[4rem] text-2xl font-bold origin-center -translate-y-1/2 translate-x-1/2 rotate-45", medalColors[rank])}/>
            <Trophy className={cn("absolute top-2 right-2 h-6 w-6 opacity-50", medalColors[rank])}/>
             <Avatar className="h-16 w-16 mb-2 border-4" style={{borderColor: `var(--color-rank-${rank})`}}>
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
            </Avatar>
            <p className="font-bold truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground">Nivel {user.level}</p>
            <p className="text-lg font-bold text-primary">{user.xp.toLocaleString()} XP</p>
        </Card>
    )
}
