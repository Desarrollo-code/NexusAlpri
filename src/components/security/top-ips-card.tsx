// src/components/security/top-ips-card.tsx
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconGlobeDetailed } from '../icons/icon-globe-detailed';

interface TopIpsCardProps {
    topIps: { ip: string; count: number; country: string }[];
    isLoading: boolean;
}

export const TopIpsCard = ({ topIps, isLoading }: TopIpsCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <IconGlobeDetailed className="h-4 w-4 text-primary" />
                    Top IPs por Actividad
                </CardTitle>
                <CardDescription className="text-xs">
                    Las direcciones de internet desde donde se realizan más acciones. Ayuda a detectar actividad inusual.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="space-y-3">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                    ) : topIps.length > 0 ? (
                        topIps.map((item, index) => (
                             <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    <IconGlobeDetailed className="h-4 w-4 text-muted-foreground shrink-0"/>
                                    <div className="flex-grow min-w-0">
                                       <p className="font-semibold truncate">{item.ip}</p>
                                       <p className="text-xs text-muted-foreground truncate">{item.country || 'Desconocido'}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-base shrink-0">{item.count}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay datos de IP disponibles.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
