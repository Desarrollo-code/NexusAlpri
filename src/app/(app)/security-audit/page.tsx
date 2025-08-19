// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldAlert, ShieldX, ShieldCheck, KeyRound, UserRound, Server, UserCog, Monitor, Globe } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityLogEvent, User as AppUser } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { getEventDetails, getInitials, parseUserAgent } from '@/lib/security-log-utils';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SecurityLogWithUser extends AppSecurityLog {
  user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

interface SecurityStats {
    successfulLogins: number;
    failedLogins: number;
    twoFactorEvents: number;
    roleChanges: number;
}

const MetricCard = ({ title, value, icon: Icon, description }: { title: string; value: number; icon: React.ElementType; description?: string }) => {
    const animatedValue = useAnimatedCounter(value);
    return (
        <Card className="shadow-sm card-border-animated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{animatedValue}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
};

export default function SecurityAuditPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [logs, setLogs] = useState<SecurityLogWithUser[]>([]);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [logsResponse, statsResponse] = await Promise.all([
                fetch('/api/security/logs'),
                fetch('/api/security/stats')
            ]);
            
            if (!logsResponse.ok || !statsResponse.ok) {
                 const errorData = !logsResponse.ok ? await logsResponse.json() : await statsResponse.json();
                 throw new Error(errorData.message || 'Failed to fetch security data');
            }

            const logsData: { logs: SecurityLogWithUser[] } = await logsResponse.json();
            const statsData: SecurityStats = await statsResponse.json();

            setLogs(logsData.logs || []);
            setStats(statsData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching data');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not load security data.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [currentUser, router, fetchData]);


    if (currentUser?.role !== 'ADMINISTRATOR') {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <p className="text-muted-foreground">Revisa los eventos de seguridad importantes de la plataforma.</p>
            </div>
            
            {isLoading && !stats ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                 </div>
            ) : stats && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Inicios de Sesión Exitosos" value={stats.successfulLogins} icon={ShieldCheck} description="Últimas 24 horas" />
                    <MetricCard title="Inicios de Sesión Fallidos" value={stats.failedLogins} icon={ShieldX} description="Últimas 24 horas" />
                    <MetricCard title="Eventos 2FA" value={stats.twoFactorEvents} icon={KeyRound} description="Últimas 24 horas" />
                    <MetricCard title="Cambios de Rol" value={stats.roleChanges} icon={UserCog} description="Últimas 24 horas" />
                 </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Registro de Eventos</CardTitle>
                    <CardDescription>Mostrando los últimos 100 eventos registrados en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && logs.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Cargando registros...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-destructive">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p className="font-semibold">{error}</p>
                            <Button onClick={fetchData} variant="outline" className="mt-4">
                                Reintentar
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Evento</TableHead>
                                        <TableHead>Detalles</TableHead>
                                        <TableHead>Usuario Afectado</TableHead>
                                        <TableHead>Dispositivo</TableHead>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead className="text-right">Fecha y Hora</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => {
                                            const eventDetails = getEventDetails(log.event, log.details);
                                            const { browser, os } = parseUserAgent(log.userAgent);
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {eventDetails.icon}
                                                            <Badge variant={eventDetails.variant}>
                                                                {eventDetails.label}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{eventDetails.details}</TableCell>
                                                     <TableCell>
                                                        {log.user ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={log.user.avatar || undefined} alt={log.user.name || 'User'} />
                                                                    <AvatarFallback>{getInitials(log.user.name)}</AvatarFallback>
                                                                </Avatar>
                                                                <Link href={`/users?search=${encodeURIComponent(log.user.name || '')}`} className="font-medium hover:underline">{log.user.name}</Link>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                               <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted"><UserRound className="h-4 w-4"/></div>
                                                                <span className="text-xs font-mono">{log.emailAttempt || 'Desconocido'}</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <Monitor className="h-4 w-4 text-muted-foreground"/> {browser} en {os}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs break-words">
                                                                    <p>{log.userAgent}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                     <TableCell>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <Globe className="h-4 w-4 text-muted-foreground"/>
                                                            {log.city && log.country ? `${log.city}, ${log.country}` : (log.ipAddress || 'Desconocida')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No hay registros de seguridad.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
