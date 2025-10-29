// src/components/security/at-risk-users-card.tsx
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Skeleton } from '@/components/ui/skeleton';
import { UserX, ShieldAlert } from 'lucide-react';
import type { SecurityStats } from '@/types';

type AtRiskUser = SecurityStats['atRiskUsers'][0];

interface AtRiskUsersCardProps {
    users: AtRiskUser[];
    onSuspend: (user: AtRiskUser) => void;
    isLoading: boolean;
}

export const AtRiskUsersCard = ({ users, onSuspend, isLoading }: AtRiskUsersCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    Usuarios en Riesgo
                </CardTitle>
                 <CardDescription className="text-xs">
                    Usuarios con más de 5 intentos fallidos de inicio de sesión en las últimas 24h.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                             <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                 <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                ) : users.length > 0 ? (
                    <div className="space-y-3">
                        {users.map((user) => (
                            <div key={user.userId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar || undefined} />
                                        <AvatarFallback><Identicon userId={user.userId} /></AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm truncate">{user.name || user.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                     <span className="font-bold text-sm text-destructive tabular-nums">{user.failedAttempts}</span>
                                     <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onSuspend(user)}>
                                        <UserX className="h-4 w-4" />
                                     </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No hay usuarios en riesgo actualmente.</p>
                )}
            </CardContent>
        </Card>
    );
};
