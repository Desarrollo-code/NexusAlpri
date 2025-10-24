// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, UserCog, HelpCircle, Filter, CheckCircle, Globe, Shield, LineChart, Percent } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityStats } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfDay, endOfDay, isValid, format } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { TopIpsCard } from '@/components/security/top-ips-card';
import { GaugeChart } from '@/components/ui/gauge';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartPagination } from '@/components/ui/pagination';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { es } from 'date-fns/locale';

const PAGE_SIZE = 8;

const ALL_EVENTS: { value: AppSecurityLog['event'] | 'ALL', label: string }[] = [
    { value: 'ALL', label: 'Todos los Eventos' },
    { value: 'SUCCESSFUL_LOGIN', label: 'Inicios de Sesión Exitosos' },
    { value: 'FAILED_LOGIN_ATTEMPT', label: 'Inicios de Sesión Fallidos' },
    { value: 'PASSWORD_CHANGE_SUCCESS', label: 'Cambios de Contraseña' },
    { value: 'TWO_FACTOR_ENABLED', label: 'Activaciones de 2FA' },
    { value: 'TWO_FACTOR_DISABLED', label: 'Desactivaciones de 2FA' },
    { value: 'USER_ROLE_CHANGED', label: 'Cambios de Rol' },
];

function SecurityAuditPageComponent() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [logs, setLogs] = useState<AppSecurityLog[]>([]);
    const [stats, setStats] = useState<Partial<SecurityStats>>({});
    const [totalLogs, setTotalLogs] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);

    const activeFilter = searchParams.get('event') || 'ALL';
    const currentPage = Number(searchParams.get('page')) || 1;
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
    });
    
    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const createQueryString = useCallback((params: Record<string, string | number | null>) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        for (const key in params) {
            const value = params[key];
            if (value === null || value === '' || value === 'ALL') {
                currentParams.delete(key);
            } else {
                currentParams.set(key, String(value));
            }
        }
        return currentParams.toString();
    }, [searchParams]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateRange?.from) params.set('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.set('endDate', dateRange.to.toISOString());
            if (activeFilter && activeFilter !== 'ALL') params.set('event', activeFilter);
            params.set('page', String(currentPage));
            
            const response = await fetch(`/api/security/logs?${params.toString()}`);
            
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || "Failed to fetch security data");
            }
            
            const data = await response.json();
            
            setLogs(data.logs || []);
            setStats(data.stats || {});
            setTotalLogs(data.totalLogs || 0);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching data';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, dateRange, activeFilter, currentPage]);
    
    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [currentUser, router, fetchData]);

    const handleFilterChange = (key: 'event' | 'date', value: string | DateRange | undefined | null) => {
        let paramsToUpdate: Record<string, string | number | null> = { page: 1 };
        
        if (key === 'date') {
            setDateRange(value as DateRange);
        } else {
            paramsToUpdate['event'] = value as string;
        }
        
        const newQuery = createQueryString(paramsToUpdate);
        router.push(`${pathname}?${newQuery}`);
    };
    
    const handlePageChange = (page: number) => {
        const newQuery = createQueryString({ page });
        router.push(`${pathname}?${newQuery}`);
    }


    if (currentUser?.role !== 'ADMINISTRATOR') {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);
    const animatedSecurityScore = useAnimatedCounter(stats.securityScore || 0, 0, 1000);
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Auditoría de Seguridad</h1>
                    <p className="text-muted-foreground">Analiza la actividad de seguridad de tu plataforma.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <DateRangePicker date={dateRange} onDateChange={(range) => handleFilterChange('date', range)} />
                     <Select value={activeFilter} onValueChange={(v) => handleFilterChange('event', v)}>
                        <SelectTrigger className="w-full sm:w-[220px]" id="security-event-filter">
                            <SelectValue placeholder="Filtrar por evento"/>
                        </SelectTrigger>
                        <SelectContent>
                            {ALL_EVENTS.map(event => (<SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                        <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                <div className="xl:col-span-2 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Línea de Tiempo de Eventos</CardTitle>
                            <CardDescription>Eventos de seguridad en el periodo seleccionado. Haz clic para ver detalles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
                            : error ? (
                                <div className="text-center py-8 text-destructive flex flex-col items-center gap-2">
                                    <AlertTriangle className="h-6 w-6"/>
                                    <p className="font-semibold">{error}</p>
                                    <Button variant="outline" size="sm" onClick={fetchData}>Reintentar</Button>
                                </div>
                            )
                            : logs.length === 0 ? <p className="text-center text-muted-foreground py-8">No hay registros para los filtros seleccionados.</p>
                            : <SecurityLogTimeline logs={logs} onLogClick={setSelectedLog} />}
                        </CardContent>
                         {totalPages > 1 && (
                            <CardFooter>
                                <SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                            </CardFooter>
                         )}
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><LineChart className="h-4 w-4 text-primary"/> Tendencia de Salud de Seguridad</CardTitle>
                        </CardHeader>
                        <CardContent className="h-48 pr-4">
                            {isLoading ? <Skeleton className="h-full w-full"/> : (
                                <ChartContainer config={{ score: { label: 'Puntuación', color: 'hsl(var(--primary))' } }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.securityScoreTrend}>
                                        <defs><linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tickFormatter={(str) => format(new Date(str), 'd MMM', {locale: es})} fontSize={12} tickLine={false} axisLine={false}/>
                                        <YAxis domain={[0, 100]} unit="%" width={40} tickLine={false} axisLine={false}/>
                                        <Tooltip content={<ChartTooltipContent formatter={(value) => `${(value as number).toFixed(1)}%`} labelFormatter={(label) => format(new Date(label), "d 'de' MMMM", { locale: es })}/>}/>
                                        <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#trend-gradient)" strokeWidth={2}/>
                                    </AreaChart>
                                </ResponsiveContainer>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="xl:col-span-1 space-y-8">
                     <Card>
                         <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary"/> Salud de Seguridad</CardTitle>
                         </CardHeader>
                         <CardContent className="flex flex-col items-center justify-center">
                            <GaugeChart value={stats.securityScore || 0}/>
                            <p className="text-4xl font-bold -mt-8">{animatedSecurityScore}%</p>
                            <p className="text-sm text-muted-foreground">Basado en inicios de sesión exitosos vs fallidos.</p>
                         </CardContent>
                     </Card>
                    <div className="grid grid-cols-2 gap-4">
                        <Card id="successful-logins-card" className="col-span-1" onClick={() => handleFilterChange('event', 'SUCCESSFUL_LOGIN')}><CardHeader><CardTitle className="text-sm font-medium">Inicios Exitosos</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.successfulLogins}</div></CardContent></Card>
                        <Card id="failed-logins-card" className="col-span-1" onClick={() => handleFilterChange('event', 'FAILED_LOGIN_ATTEMPT')}><CardHeader><CardTitle className="text-sm font-medium">Intentos Fallidos</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.failedLogins}</div></CardContent></Card>
                    </div>
                    <Card id="2fa-adoption-card"><CardHeader><CardTitle className="text-sm font-medium">Adopción 2FA</CardTitle><Percent className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.twoFactorAdoptionRate?.toFixed(1)}%</div></CardContent></Card>
                    <TopIpsCard topIps={stats.topIps || []} isLoading={isLoading} />
                    <DeviceDistributionChart browserData={stats.browsers} osData={stats.os} isLoading={isLoading} />
                </div>
            </div>
            
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}

export default function SecurityAuditPageWrapper() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SecurityAuditPageComponent />
        </Suspense>
    );
}
