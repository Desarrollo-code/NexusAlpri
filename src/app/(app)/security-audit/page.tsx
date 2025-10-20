// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Monitor, Globe, HelpCircle, AlertTriangle, BarChart3, TrendingUp, Users, Shield, Clock, UserCog } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, User as AppUser, SecurityLogEvent, SecurityStats } from '@/types';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, BarChart, XAxis, YAxis, CartesianGrid, Bar, PieChart, Pie, Cell } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { MetricCard } from '@/components/analytics/metric-card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

const PAGE_SIZE = 15;

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
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const activeFilter = searchParams.get('event') || 'ALL';
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const fetchLogs = useCallback(async () => {
        setIsLoadingLogs(true);
        setError(null);
        try {
            const params = new URLSearchParams(searchParams.toString());
            params.set('pageSize', String(PAGE_SIZE));
            const response = await fetch(`/api/security/logs?${params.toString()}`);
            if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch security logs');
            const data = await response.json();
            setLogs(data.logs || []);
            setTotalLogs(data.totalLogs || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching logs');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not load security logs.', variant: 'destructive' });
        } finally {
            setIsLoadingLogs(false);
        }
    }, [searchParams, toast]);
    
    const fetchStats = useCallback(async () => {
        setIsLoadingStats(true);
        try {
            const response = await fetch('/api/security/stats');
             if (!response.ok) throw new Error((await response.json()).message || 'Failed to fetch security stats');
            const data = await response.json();
            setStats(data);
        } catch (err) {
             console.error("Stats fetching error:", err); // Log but don't show toast for stats
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser?.role === 'ADMINISTRATOR') {
            fetchLogs();
            fetchStats();
        } else if (currentUser) {
             router.push('/dashboard');
        }
    }, [currentUser, router, fetchLogs, fetchStats]);
    
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

    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    const browserChartConfig: ChartConfig = useMemo(() => {
        if (!stats?.topBrowsers) return {};
        const config: ChartConfig = {};
        stats.topBrowsers.slice(0, 5).forEach((item, index) => {
            config[item.browser] = {
                label: item.browser,
                color: `hsl(var(--chart-${(index % 5) + 1}))`
            }
        });
        return config;
    }, [stats]);
    
    const osChartConfig: ChartConfig = useMemo(() => {
        if (!stats?.topOS) return {};
        const config: ChartConfig = {};
        stats.topOS.slice(0, 5).forEach((item, index) => {
            config[item.os] = {
                label: item.os,
                color: `hsl(var(--chart-${(index % 5) + 1}))`
            }
        });
        return config;
    }, [stats]);

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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4" id="security-stats-cards">
                {isLoadingStats ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />) : <>
                    <MetricCard title="Inicios de Sesión Exitosos" value={stats?.successfulLogins24h || 0} icon={Users} description="Últimas 24h" gradient="bg-gradient-green" />
                    <MetricCard title="Intentos de Acceso Fallidos" value={stats?.failedLogins24h || 0} icon={AlertTriangle} description="Últimas 24h" gradient="bg-gradient-orange" />
                    <MetricCard title="Cambios de Roles" value={stats?.roleChanges24h || 0} icon={UserCog} description="Últimas 24h" gradient="bg-gradient-purple" />
                    <MetricCard title="Eventos Críticos" value={stats?.criticalEvents24h || 0} icon={Shield} description="Últimas 24h" gradient="bg-gradient-blue" />
                </>}
            </div>

            <Separator />
            
            <Tabs defaultValue="activity">
                 <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
                    <TabsTrigger value="activity">Actividad</TabsTrigger>
                    <TabsTrigger value="browsers">Navegadores</TabsTrigger>
                    <TabsTrigger value="os">Sistemas Operativos</TabsTrigger>
                 </TabsList>
                 <TabsContent value="activity" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><TrendingUp/>Actividad de Inicios de Sesión</CardTitle>
                            <CardDescription>Resumen de los últimos 7 días.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                            {isLoadingStats ? <Skeleton className="h-full w-full"/> : <ChartContainer config={{count: {label: "Inicios de Sesión"}}} className="w-full h-full">
                                <BarChart data={stats?.loginsLast7Days || []} margin={{top: 5, right: 10, left: -20, bottom: 5}}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { weekday: 'short' })}/>
                                <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line"/>} />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                            </BarChart>
                            </ChartContainer>}
                        </CardContent>
                    </Card>
                 </TabsContent>
                 <TabsContent value="browsers" className="mt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Monitor/>Navegadores Más Utilizados</CardTitle>
                        </CardHeader>
                        <CardContent className="h-72 flex items-center justify-center">
                            {isLoadingStats ? <Skeleton className="h-full w-full"/> : <ChartContainer config={browserChartConfig} className="w-full h-full">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={stats?.topBrowsers} dataKey="count" nameKey="browser" innerRadius={50} strokeWidth={2}>
                                    {(stats?.topBrowsers || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={browserChartConfig[entry.browser]?.color} />
                                    ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>}
                        </CardContent>
                    </Card>
                 </TabsContent>
                 <TabsContent value="os" className="mt-4">
                      <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Monitor/>Sistemas Operativos Más Utilizados</CardTitle>
                        </CardHeader>
                        <CardContent className="h-72 flex items-center justify-center">
                            {isLoadingStats ? <Skeleton className="h-full w-full"/> : <ChartContainer config={osChartConfig} className="w-full h-full">
                                <PieChart>
                                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={stats?.topOS} dataKey="count" nameKey="os" innerRadius={50} strokeWidth={2}>
                                    {(stats?.topOS || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={osChartConfig[entry.os]?.color} />
                                    ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>}
                        </CardContent>
                    </Card>
                 </TabsContent>
            </Tabs>
            
            <TooltipProvider>
                <Card id="security-log-table">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <CardTitle>Registro de Eventos Detallado</CardTitle>
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
                        {(isLoadingLogs && logs.length === 0) ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div> : 
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
