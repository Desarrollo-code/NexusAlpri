// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Monitor, Globe, HelpCircle, AlertTriangle } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, User as AppUser, SecurityLogEvent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { getEventDetails, parseUserAgent } from '@/lib/security-log-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTitle } from '@/contexts/title-context';
import { SmartPagination } from '@/components/ui/pagination';
import { Identicon } from '@/components/ui/identicon';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
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

export default function SecurityAuditPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [logs, setLogs] = useState<SecurityLogWithUser[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
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
            const logsResponse = await fetch(`/api/security/logs?${logsParams.toString()}`);
            
            if (!logsResponse.ok) throw new Error((await logsResponse.json()).message || 'Failed to fetch security logs');
            
            const logsData = await logsResponse.json();
            setLogs(logsData.logs || []);
            setTotalLogs(logsData.totalLogs || 0);

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
            if (value === null || value === '' || (name === 'event' && value === 'ALL')) params.delete(name);
            else params.set(name, String(value));
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
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Auditoría de Seguridad</h1>
                    <p className="text-muted-foreground">Revisa los eventos de seguridad importantes de la plataforma.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
            </div>
            
            <TooltipProvider>
                <Card id="security-log-table">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Registro de Eventos</CardTitle>
                                <CardDescription>Mostrando {totalLogs} registros de seguridad.</CardDescription>
                            </div>
                            <div id="security-event-filter">
                                <Select value={activeFilter} onValueChange={handleFilterChange}>
                                    <SelectTrigger className="w-full sm:w-[250px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ALL_EVENTS.map(event => (<SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(isLoading && logs.length === 0) ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div> : 
                            error ? <div className="text-center py-8 text-destructive">{error}</div> : 
                            logs.length === 0 ? <p className="text-center text-muted-foreground py-8">No hay registros para el filtro seleccionado.</p> : (
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
                                            const eventDetails = getEventDetails(log.event as SecurityLogEvent, log.details);
                                            const { browser, os } = parseUserAgent(log.userAgent);
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell><div className="flex items-center gap-2">{eventDetails.icon}<Badge variant={eventDetails.variant}>{eventDetails.label}</Badge></div></TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{eventDetails.details}</TableCell>
                                                    <TableCell>
                                                        {log.user ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8"><AvatarImage src={log.user.avatar || undefined} /><AvatarFallback><Identicon userId={log.user.id} /></AvatarFallback></Avatar>
                                                                <Link href={`/users?search=${encodeURIComponent(log.user.name || '')}`} className="font-medium hover:underline">{log.user.name}</Link>
                                                            </div>
                                                        ) : <div className="flex items-center gap-2 text-muted-foreground"><div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted"><UserCog className="h-4 w-4"/></div><span className="text-xs font-mono">{log.emailAttempt || 'Desconocido'}</span></div>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip>
                                                            <TooltipTrigger><div className="flex items-center gap-2 text-xs"><Monitor className="h-4 w-4 text-muted-foreground"/> {browser} en {os}</div></TooltipTrigger>
                                                            <TooltipContent className="max-w-xs break-words"><p>{log.userAgent}</p></TooltipContent>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell><div className="flex items-center gap-2 text-xs"><Globe className="h-4 w-4 text-muted-foreground"/>{log.city && log.country ? `${log.city}, ${log.country}` : (log.ipAddress || 'Desconocida')}</div></TableCell>
                                                    <TableCell className="text-right text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                    </CardContent>
                    {totalPages > 1 && (<CardFooter><SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></CardFooter>)}
                </Card>
            </TooltipProvider>
        </div>
    );
}