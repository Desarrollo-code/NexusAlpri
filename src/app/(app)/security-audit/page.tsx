// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Monitor, Globe, HelpCircle, AlertTriangle, BarChart3, Users, Shield, Clock, UserCog, Map as MapIcon, Chrome, Apple, Smartphone, GlobeIcon, ArrowRight, UserPlus, ShieldCheck, FileText, Map } from 'lucide-react';
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
import { MetricCard } from '@/components/analytics/metric-card';
import { DeviceDistributionChart } from '@/components/analytics/security-charts';


interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

const PAGE_SIZE = 10;

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deviceData, setDeviceData] = useState<{ browserData: any[], osData: any[] }>({ browserData: [], osData: [] });
    
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
            const tableParams = new URLSearchParams(searchParams.toString());
            tableParams.set('pageSize', String(PAGE_SIZE));

            const [tableResponse, statsResponse] = await Promise.all([
                fetch(`/api/security/logs?${tableParams.toString()}`),
                fetch('/api/security/stats')
            ]);
            
            if (!tableResponse.ok) throw new Error((await tableResponse.json()).message || 'Failed to fetch security logs');
            if (!statsResponse.ok) throw new Error((await statsResponse.json()).message || 'Failed to fetch security stats');
            
            const tableData = await tableResponse.json();
            const statsData = await statsResponse.json();

            setLogs(tableData.logs || []);
            setTotalLogs(tableData.totalLogs || 0);
            setStats(statsData);
            setDeviceData(processDeviceData(tableData.logs || []));

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [searchParams, toast]);
    
    useEffect(() => {
        if (currentUser?.role === 'ADMINISTRATOR') {
            fetchData();
        } else if (currentUser) {
             router.push('/dashboard');
        }
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
    
    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold">Error al Cargar Datos</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchData} className="mt-4">Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Monitoriza la actividad y la seguridad de tu plataforma.</p>
                <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card id="security-stats-cards">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary"/>
                            Actividad Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MetricCard title="Inicios Exitosos" value={stats?.successfulLogins24h || 0} icon={ShieldCheck} description="Últimas 24h" trendData={stats?.loginsLast7Days || []} dataKey="count" gradient="bg-gradient-green" color="hsl(var(--chart-2))" />
                        <MetricCard title="Intentos Fallidos" value={stats?.failedLogins24h || 0} icon={AlertTriangle} description="Últimas 24h" gradient="bg-gradient-orange" color="hsl(var(--chart-4))" />
                        <MetricCard title="Cambios de Rol" value={stats?.roleChanges24h || 0} icon={UserCog} description="Últimas 24h" gradient="bg-gradient-blue" color="hsl(var(--chart-1))" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2">
                             <Map className="h-5 w-5 text-primary"/>
                             Mapa de Accesos
                         </CardTitle>
                    </CardHeader>
                    <CardContent className="h-40 flex flex-col items-center justify-center bg-muted/30 rounded-lg">
                        <MapIcon className="h-10 w-10 text-muted-foreground mb-2"/>
                        <h3 className="font-semibold text-lg text-foreground">Próximamente</h3>
                        <p className="text-sm text-muted-foreground">Visualización geográfica de inicios de sesión.</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DeviceDistributionChart browserData={deviceData.browserData} osData={deviceData.osData} />

                <Card id="security-log-table">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Registro de Eventos Detallado
                                </CardTitle>
                                <CardDescription>Mostrando los últimos {logs.length} de {totalLogs} registros.</CardDescription>
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
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Evento</TableHead>
                                    <TableHead>Detalles</TableHead>
                                    <TableHead>Usuario</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No hay registros para el filtro seleccionado.</TableCell></TableRow>
                                ) : (
                                    logs.map((log) => {
                                        const eventDetails = getEventDetails(log.event as SecurityLogEvent, log.details);
                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                  <div className="flex items-center gap-2">
                                                    {eventDetails.icon}
                                                    <Badge variant={eventDetails.variant}>{eventDetails.label}</Badge>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{eventDetails.details}</TableCell>
                                                <TableCell>
                                                    {log.user ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-7 w-7"><AvatarImage src={log.user.avatar || undefined} /><AvatarFallback><Identicon userId={log.user.id} /></AvatarFallback></Avatar>
                                                            <span className="text-sm font-medium">{log.user.name}</span>
                                                        </div>
                                                    ) : <div className="flex items-center gap-2 text-muted-foreground"><div className="h-7 w-7 flex items-center justify-center rounded-full bg-muted"><UserPlus className="h-4 w-4"/></div><span className="text-xs font-mono">{log.emailAttempt || 'Desconocido'}</span></div>}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" size="sm" asChild className="w-full">
                           <Link href="/security-audit/full-log">
                                Ver todos los eventos <ArrowRight className="ml-2 h-4 w-4"/>
                           </Link>
                       </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
