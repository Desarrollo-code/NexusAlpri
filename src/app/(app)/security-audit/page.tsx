// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Loader2, AlertTriangle, UserCog, HelpCircle, Filter } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityStats, SecurityLogEvent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/components/tour/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { type DateRange } from 'react-day-picker';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { GlobalAccessMap } from '@/components/security/global-access-map';
import { MetricCard } from '@/components/security/metric-card';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { Card, CardContent } from '@/components/ui/card';

const ALL_EVENTS: { value: SecurityLogEvent | 'ALL', label: string }[] = [
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
        from: startOfDay(subDays(new Date(), 29)),
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
            
            const [logsRes, statsRes] = await Promise.all([
                fetch(`/api/security/logs?${params.toString()}`),
                fetch(`/api/security/stats?${params.toString()}`)
            ]);

            if (!logsRes.ok || !statsRes.ok) {
                 const errorLogs = !logsRes.ok ? await logsRes.json() : null;
                 const errorStats = !statsRes.ok ? await statsRes.json() : null;
                 throw new Error(errorLogs?.message || errorStats?.message || "Failed to fetch security data");
            }
            
            const logsData = await logsRes.json();
            const statsData = await statsRes.json();
            
            setLogs(logsData.logs || []);
            setStats(statsData || {});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching data');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not load security data.', variant: 'destructive' });
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
    
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (dateRange?.from || dateRange?.to) count++;
        if (activeFilter !== 'ALL') count++;
        return count;
    }, [dateRange, activeFilter]);


    if (currentUser?.role !== 'ADMINISTRATOR') {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="security-stats-cards">
                 <MetricCard id="successful-logins-card" title="Inicios de Sesión Exitosos" value={stats.successfulLogins || 0} icon={CheckCircle} onClick={() => handleFilterChange('event', 'SUCCESSFUL_LOGIN')} />
                 <MetricCard id="failed-logins-card" title="Intentos Fallidos" value={stats.failedLogins || 0} icon={AlertTriangle} onClick={() => handleFilterChange('event', 'FAILED_LOGIN_ATTEMPT')} />
                 <MetricCard id="role-changes-card" title="Cambios de Rol" value={stats.roleChanges || 0} icon={UserCog} onClick={() => handleFilterChange('event', 'USER_ROLE_CHANGED')} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                   <GlobalAccessMap accessPoints={logs} />
                </div>
                <DeviceDistributionChart browserData={stats.browsers} osData={stats.os} isLoading={isLoading} />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Línea de Tiempo de Eventos</CardTitle>
                    <CardDescription>Eventos de seguridad en el período seleccionado. Haz clic en un evento para ver detalles.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
                     : error ? <div className="text-center py-8 text-destructive">{error}</div>
                     : logs.length === 0 ? <p className="text-center text-muted-foreground py-8">No hay registros para los filtros seleccionados.</p>
                     : <SecurityLogTimeline logs={logs} onLogClick={setSelectedLog} />}
                </CardContent>
            </Card>

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
