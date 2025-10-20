// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Monitor, Globe, HelpCircle, AlertTriangle, BarChart3, TrendingUp, Users, Shield, Clock, UserCog, Map, Chrome, Firefox, GlobeIcon, Apple, Windows, Smartphone } from 'lucide-react';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, BarChart, XAxis, YAxis, CartesianGrid, Bar, Cell, ResponsiveContainer } from '@/components/ui/chart';
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

const processDeviceData = (logs: SecurityLogWithUser[]) => {
    const browserCounts: { [key: string]: number } = {};
    const osCounts: { [key: string]: number } = {};

    logs.forEach(log => {
        const { browser, os } = parseUserAgent(log.userAgent);
        if (browser !== 'Desconocido') {
            browserCounts[browser] = (browserCounts[browser] || 0) + 1;
        }
        if (os !== 'Desconocido') {
            osCounts[os] = (osCounts[os] || 0) + 1;
        }
    });

    const toChartData = (counts: { [key: string]: number }) => {
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    return {
        browserData: toChartData(browserCounts),
        osData: toChartData(osCounts),
    };
};

const CustomYAxisTick = ({ y, payload }: any) => {
    const iconMap: Record<string, React.ElementType> = {
        'Chrome': Chrome,
        'Firefox': Firefox,
        'Safari': GlobeIcon,
        'Edge': GlobeIcon,
        'Windows 11/10': Windows,
        'macOS': Apple,
        'Linux': Monitor,
        'Android': Smartphone,
        'iOS': Apple,
    };
    const Icon = iconMap[payload.value] || Monitor;
    return (
        <g transform={`translate(0,${y})`}>
            <foreignObject x="-70" y="-10" width="60" height="20" className="text-right">
                <div className="flex items-center justify-end gap-1.5 w-full">
                    <span className="text-xs text-muted-foreground truncate">{payload.value}</span>
                    <Icon className="h-3.5 w-3.5 text-foreground shrink-0" />
                </div>
            </foreignObject>
        </g>
    );
}

const DeviceDistributionChart = ({ title, data, config }: { title: string, data: any[], config: ChartConfig }) => (
    <div>
        <h4 className="font-medium text-sm mb-2">{title}</h4>
        {data.length > 0 ? (
            <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 70, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" hide tickLine={false} axisLine={false} tick={<CustomYAxisTick />} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`var(--color-${entry.name})`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : <p className="text-xs text-muted-foreground h-40 flex items-center justify-center">No hay datos suficientes.</p>}
    </div>
);


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
    const [deviceData, setDeviceData] = useState<{ browserData: any[], osData: any[] }>({ browserData: [], osData: [] });
    
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
    
     const fetchAllLogsForCharts = useCallback(async () => {
        try {
            const response = await fetch(`/api/security/logs?all=true`);
            if (!response.ok) throw new Error('Failed to fetch all logs for charts');
            const data = await response.json();
            if (data.logs) {
                setDeviceData(processDeviceData(data.logs));
            }
        } catch (err) {
            console.error(err); // Log error silently
        }
    }, []);

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
            fetchAllLogsForCharts();
        } else if (currentUser) {
             router.push('/dashboard');
        }
    }, [currentUser, router, fetchLogs, fetchStats, fetchAllLogsForCharts]);
    
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
    
    const deviceChartConfig: ChartConfig = useMemo(() => {
        const config: ChartConfig = {};
        [...deviceData.browserData, ...deviceData.osData].forEach((item, index) => {
            config[item.name] = {
                color: `hsl(var(--chart-${(index % 5) + 1}))`
            }
        });
        return config;
    }, [deviceData]);

    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
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

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
                    <CardContent>
                        {isLoadingLogs ? (
                            <div className="space-y-4">{[...Array(5)].map((_, i) => (<div key={i} className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>))}</div>
                        ) : (
                            <ul className="space-y-4">
                                {logs.slice(0, 5).map(log => {
                                   const eventUI = getEventDetails(log.event as SecurityLogEvent, log.details);
                                   return (
                                    <li key={log.id} className="flex items-center gap-3">
                                        <div className="p-2 bg-muted rounded-full">{eventUI.icon}</div>
                                        <div className="text-sm">
                                            <p className="font-semibold">{log.user?.name || log.emailAttempt}</p>
                                            <p className="text-muted-foreground">{eventUI.label}</p>
                                        </div>
                                    </li>
                                   )
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center">
                    <CardHeader><CardTitle>Mapa de Accesos</CardTitle></CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center">
                        <Map className="h-16 w-16 text-muted-foreground mb-4"/>
                        <p className="font-semibold">Próximamente</p>
                        <p className="text-sm text-muted-foreground">Visualización geográfica de inicios de sesión.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Distribución de Dispositivos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <ChartContainer config={deviceChartConfig} className="w-full">
                           <DeviceDistributionChart title="Navegadores" data={deviceData.browserData} config={deviceChartConfig}/>
                           <Separator className="my-4"/>
                           <DeviceDistributionChart title="Sistemas Operativos" data={deviceData.osData} config={deviceChartConfig}/>
                        </ChartContainer>
                    </CardContent>
                 </Card>
             </div>
            
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
                                {isLoadingLogs ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                            <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-32" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : error ? (
                                    <TableRow><TableCell colSpan={6} className="text-center text-destructive">{error}</TableCell></TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No hay registros para el filtro seleccionado.</TableCell></TableRow>
                                ) : (
                                    logs.map((log) => {
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
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    {totalPages > 1 && (<CardFooter><SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /></CardFooter>)}
                </Card>
            </TooltipProvider>
        </div>
    );
}