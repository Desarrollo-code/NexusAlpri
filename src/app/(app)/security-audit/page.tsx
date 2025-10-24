// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, UserCog, HelpCircle, Filter, CheckCircle, Globe } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityStats } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfDay, endOfDay, isValid } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { MetricCard } from '@/components/security/metric-card';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { TopIpsCard } from '@/components/security/top-ips-card';
import { GaugeChart } from '@/components/ui/gauge';
import { Skeleton } from '@/components/ui/skeleton';

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);

    const activeFilter = searchParams.get('event') || 'ALL';
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
    });
    
    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const createQueryString = useCallback((params: Record<string, string | null>) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        for (const key in params) {
            const value = params[key];
            if (value === null) {
                currentParams.delete(key);
            } else {
                currentParams.set(key, value);
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
            
            const response = await fetch(`/api/security/logs?${params.toString()}`);
            
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || "Failed to fetch security data");
            }
            
            const data = await response.json();
            
            setLogs(data.logs || []);
            setStats(data.stats || {});
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching data';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, dateRange, activeFilter]);
    
    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [currentUser, router, fetchData]);

    const handleFilterChange = (key: 'event' | 'date', value: string | DateRange | undefined | null) => {
        let newQuery;
        if (key === 'date') {
            const range = value as DateRange;
            newQuery = createQueryString({
                startDate: range?.from?.toISOString() ?? null,
                endDate: range?.to?.toISOString() ?? null,
            });
             setDateRange(range);
        } else {
            newQuery = createQueryString({ event: value as string });
        }
        router.push(`${pathname}?${newQuery}`);
    };

    if (currentUser?.role !== 'ADMINISTRATOR') {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
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
                        <SelectTrigger className="w-full sm:w-[220px]">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 order-2 lg:order-1 space-y-8">
                     <div id="security-stats-cards" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard id="successful-logins-card" title="Inicios de Sesión" value={isLoading ? 0 : (stats.successfulLogins || 0)} icon={CheckCircle} onClick={() => handleFilterChange('event', 'SUCCESSFUL_LOGIN')} />
                        <MetricCard id="failed-logins-card" title="Intentos Fallidos" value={isLoading ? 0 : (stats.failedLogins || 0)} icon={AlertTriangle} onClick={() => handleFilterChange('event', 'FAILED_LOGIN_ATTEMPT')} />
                        <MetricCard id="role-changes-card" title="Cambios de Rol" value={isLoading ? 0 : (stats.roleChanges || 0)} icon={UserCog} onClick={() => handleFilterChange('event', 'USER_ROLE_CHANGED')} />
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">Salud de Seguridad</CardTitle><ShieldAlert className="h-4 w-4 text-muted-foreground"/></CardHeader>
                            <CardContent className="flex items-center justify-center pt-2">
                               {isLoading ? <Skeleton className="h-12 w-24"/> : <GaugeChart value={stats.securityScore || 0} size="sm" />}
                            </CardContent>
                        </Card>
                    </div>

                     <DeviceDistributionChart browserData={stats.browsers} osData={stats.os} isLoading={isLoading} />
                    
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
                    </Card>
                </div>
                
                <div className="lg:col-span-1 order-1 lg:order-2 space-y-8 lg:sticky lg:top-24">
                     <TopIpsCard topIps={stats.topIps || []} isLoading={isLoading} />
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
