
// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldAlert, ShieldX, ShieldCheck, KeyRound, UserCog, Monitor, Globe, HelpCircle } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, User as AppUser, SecurityLogEvent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { getEventDetails, parseUserAgent } from '@/lib/security-log-utils';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTitle } from '@/contexts/title-context';
import { SmartPagination } from '@/components/ui/pagination';
import { Identicon } from '@/components/ui/identicon';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SecurityLogWithUser extends AppSecurityLog {
  user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

interface SecurityStats {
    successfulLogins: number;
    failedLogins: number;
    twoFactorEvents: number;
    roleChanges: number;
}

const PAGE_SIZE = 20;

const ALL_EVENTS: { value: SecurityLogEvent | 'ALL', label: string }[] = [
    { value: 'ALL', label: 'Todos los Eventos' },
    { value: 'SUCCESSFUL_LOGIN', label: 'Inicios de Sesión Exitosos' },
    { value: 'FAILED_LOGIN_ATTEMPT', label: 'Inicios de Sesión Fallidos' },
    { value: 'PASSWORD_CHANGE_SUCCESS', label: 'Cambios de Contraseña' },
    { value: 'TWO_FACTOR_ENABLED', label: 'Activaciones de 2FA' },
    { value: 'TWO_FACTOR_DISABLED', label: 'Desactivaciones de 2FA' },
    { value: 'USER_ROLE_CHANGED', label: 'Cambios de Rol' },
];


const MetricCard = ({ title, value, icon: Icon, description, gradient }: { title: string; value: number; icon: React.ElementType; description?: string, gradient: string }) => {
    const animatedValue = useAnimatedCounter(value);
    return (
        <Card className={cn("relative overflow-hidden text-white card-border-animated", gradient)}>
            <div className="absolute inset-0 bg-black/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
                <Icon className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent className="relative">
                <div className="text-3xl font-bold text-white">{animatedValue}</div>
                {description && <p className="text-xs text-white/70">{description}</p>}
            </CardContent>
        </Card>
    );
};

export default function SecurityAuditPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const isMobile = useIsMobile();
    const { startTour, forceStartTour } = useTour();

    const [logs, setLogs] = useState<SecurityLogWithUser[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const activeFilter = searchParams.get('event') || 'ALL';
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const logsParams = new URLSearchParams(searchParams.toString());

            const [logsResponse, statsResponse] = await Promise.all([
                fetch(`/api/security/logs?${logsParams.toString()}`),
                fetch('/api/security/stats')
            ]);
            
            if (!logsResponse.ok) {
                 const errorData = await logsResponse.json();
                 throw new Error(errorData.message || 'Failed to fetch security logs');
            }
            if (!statsResponse.ok) {
                 const errorData = await statsResponse.json();
                 throw new Error(errorData.message || 'Failed to fetch security stats');
            }

            const logsData: { logs: SecurityLogWithUser[], totalLogs: number } = await logsResponse.json();
            const statsData: SecurityStats = await statsResponse.json();

            setLogs(logsData.logs || []);
            setTotalLogs(logsData.totalLogs || 0);
            setStats(statsData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching data');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not load security data.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, searchParams]);

    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [currentUser, router, fetchData]);
    
    
    const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(paramsToUpdate).forEach(([name, value]) => {
            if (value === null || value === '' || (name === 'event' && value === 'ALL')) {
                params.delete(name);
            } else {
                params.set(name, String(value));
            }
        });
        return params.toString();
      }, [searchParams]);

    const handleFilterChange = (newEvent: string) => {
        router.push(`${pathname}?${createQueryString({ event: newEvent, page: 1 })}`);
    }

    const handlePageChange = (page: number) => {
        router.push(`${pathname}?${createQueryString({ page })}`);
    };


    if (currentUser?.role !== 'ADMINISTRATOR') {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">Auditoría de Seguridad</h2>
                    <p className="text-muted-foreground">Revisa los eventos de seguridad importantes de la plataforma.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
            </div>
            
            {(isLoading && !stats) ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                 </div>
            ) : stats && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="security-stats-cards">
                    <MetricCard title="Inicios de Sesión Exitosos" value={stats.successfulLogins} icon={ShieldCheck} description="Últimas 24 horas" gradient="bg-gradient-green" />
                    <MetricCard title="Inicios de Sesión Fallidos" value={stats.failedLogins} icon={ShieldX} description="Últimas 24 horas" gradient="bg-gradient-orange" />
                    <MetricCard title="Eventos 2FA" value={stats.twoFactorEvents} icon={KeyRound} description="Últimas 24 horas" gradient="bg-gradient-blue" />
                    <MetricCard title="Cambios de Rol" value={stats.roleChanges} icon={UserCog} description="Últimas 24 horas" gradient="bg-gradient-purple" />
                 </div>
            )}

            <Card id="security-log-table">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                             <CardTitle>Registro de Eventos</CardTitle>
                             <CardDescription>Mostrando los últimos registros de seguridad de la plataforma.</CardDescription>
                        </div>
                        <div id="security-event-filter">
                            <Select value={activeFilter} onValueChange={handleFilterChange}>
                                <SelectTrigger className="w-full sm:w-[250px]">
                                    <SelectValue placeholder="Filtrar por evento..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {ALL_EVENTS.map(event => (
                                        <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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
                            <Button onClick={() => fetchData()} variant="outline" className="mt-4">
                                Reintentar
                            </Button>
                        </div>
                    ) : logs.length === 0 ? (
                       <p className="text-center text-muted-foreground py-8">No hay registros para el filtro seleccionado.</p>
                    ) : isMobile ? (
                        <div className="space-y-4">
                            {logs.map((log) => {
                                const eventDetails = getEventDetails(log.event, log.details);
                                const { browser, os } = parseUserAgent(log.userAgent);
                                return (
                                    <Card key={log.id} className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="pt-1">{eventDetails.icon}</div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant={eventDetails.variant}>{eventDetails.label}</Badge>
                                                     <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('es-CO', { timeStyle: 'short' })}</p>
                                                </div>
                                                <p className="text-sm mt-1">{eventDetails.details}</p>
                                                {log.user ? (
                                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                                        <Avatar className="h-8 w-8"><AvatarImage src={log.user.avatar || undefined} /><AvatarFallback><Identicon userId={log.user.id} /></AvatarFallback></Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">{log.user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{log.emailAttempt}</p>
                                                        </div>
                                                    </div>
                                                ) : <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">{log.emailAttempt}</p>}
                                                 <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2"><Globe className="h-4 w-4"/> {log.city && log.country ? `${log.city}, ${log.country}` : (log.ipAddress || 'Desconocida')}</div>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
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
                                    {logs.map((log) => {
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
                                                                {log.user.avatar ? <AvatarImage src={log.user.avatar} alt={log.user.name || 'User'} /> : null}
                                                                <AvatarFallback>
                                                                    <Identicon userId={log.user.id} />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <Link href={`/users?search=${encodeURIComponent(log.user.name || '')}`} className="font-medium hover:underline">{log.user.name}</Link>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted"><UserCog className="h-4 w-4"/></div>
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
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter>
                        <SmartPagination
                           currentPage={currentPage}
                           totalPages={totalPages}
                           onPageChange={handlePageChange}
                        />
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
