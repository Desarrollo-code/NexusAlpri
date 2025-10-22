// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Globe, HelpCircle, CheckCircle, XCircle, UserCog, Monitor, Download, Calendar as CalendarIcon, Server, ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { SecurityLog, SecurityStats } from '@/types';
import { Button } from '@/components/ui/button';
import { startOfDay, subDays } from 'date-fns';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { MetricCard } from '@/components/security/metric-card';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { ExportToCsvButton } from '@/components/ui/export-to-csv';
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalAccessMap } from '@/components/security/global-access-map';
import { parseUserAgent } from '@/lib/security-log-utils';

const aggregateStatsFromLogs = (logs: SecurityLog[]): SecurityStats => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let successfulLogins24h = 0;
    let failedLogins24h = 0;
    let roleChanges24h = 0;
    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};
    const ipCounts: Record<string, { count: number, country: string | null }> = {};

    logs.forEach(log => {
        const logDate = new Date(log.createdAt);
        if (logDate >= twentyFourHoursAgo) {
            if (log.event === 'SUCCESSFUL_LOGIN') successfulLogins24h++;
            if (log.event === 'FAILED_LOGIN_ATTEMPT') failedLogins24h++;
            if (log.event === 'USER_ROLE_CHANGED') roleChanges24h++;
        }

        const { browser, os } = parseUserAgent(log.userAgent);
        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
        osCounts[os] = (osCounts[os] || 0) + 1;

        if (log.ipAddress) {
            if (!ipCounts[log.ipAddress]) {
                ipCounts[log.ipAddress] = { count: 0, country: log.country };
            }
            ipCounts[log.ipAddress].count++;
        }
    });
    
    const toSortedArray = (counts: Record<string, number>) => Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const topIps = Object.entries(ipCounts).map(([ip, data]) => ({ ipAddress: ip, ...data, _count: { ipAddress: data.count } })).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
        successfulLogins24h,
        failedLogins24h,
        roleChanges24h,
        browsers: toSortedArray(browserCounts),
        os: toSortedArray(osCounts),
        topIps: topIps as any,
    };
};


export default function SecurityAuditPage() {
    const { setPageTitle } = useTitle();
    const { user } = useAuth();
    const [allLogs, setAllLogs] = useState<SecurityLog[]>([]);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
    
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: subDays(new Date(), 6), to: new Date() });
    
    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
    }, [setPageTitle]);

    const fetchData = useCallback(async () => {
        if (user?.role !== 'ADMINISTRATOR') {
             setIsLoading(false);
             setError("Acceso denegado.");
             return;
        };
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
             if (dateRange.from) params.set('startDate', startOfDay(dateRange.from).toISOString());
            if (dateRange.to) params.set('endDate', startOfDay(dateRange.to).toISOString());
            
            const response = await fetch(`/api/security/logs?all=true&${params.toString()}`);
            if (!response.ok) throw new Error('No se pudieron cargar los registros de seguridad.');
            const data = await response.json();
            const logsData = data.logs || [];
            setAllLogs(logsData);

            const calculatedStats = aggregateStatsFromLogs(logsData);
            setStats(calculatedStats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, [user, dateRange]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const criticalEvents = useMemo(() => {
        return allLogs
            .filter(log => log.event === 'FAILED_LOGIN_ATTEMPT' || log.event === 'USER_ROLE_CHANGED')
            .slice(0, 5);
    }, [allLogs]);

    return (
        <>
           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Monitoriza la actividad, los accesos y los eventos de seguridad de la plataforma.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <ExportToCsvButton data={allLogs} filename={`seguridad_${new Date().toISOString().split('T')[0]}`} />
                    <DateRangePicker date={{ from: dateRange.from, to: dateRange.to }} onDateChange={setDateRange} />
                </div>
            </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <div className="lg:col-span-4 xl:col-span-3">
                    <Card id="security-log-timeline" className="bg-card/80 backdrop-blur-lg">
                        <CardHeader>
                            <CardTitle>Registro de Eventos</CardTitle>
                            <CardDescription>Actividad en el rango de fechas seleccionado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                             error ? <div className="h-96 flex flex-col items-center justify-center text-destructive"><AlertTriangle className="h-6 w-6 mb-2"/>{error}</div> :
                             allLogs.length > 0 ? <SecurityLogTimeline logs={allLogs} onLogClick={setSelectedLog} /> :
                             <div className="h-48 flex flex-col items-center justify-center text-muted-foreground"><p>No hay eventos para el rango de fechas seleccionado.</p></div>
                            }
                        </CardContent>
                    </Card>
                </div>
                
                 <div className="lg:col-span-5 xl:col-span-6 space-y-6">
                    <Card className="h-[400px] flex flex-col bg-card/80 backdrop-blur-lg p-0 overflow-hidden">
                         <CardHeader>
                            <CardTitle>Mapa de Accesos Global</CardTitle>
                        </CardHeader>
                         <CardContent className="p-0 flex-grow flex items-center justify-center">
                            {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                             <GlobalAccessMap accessPoints={allLogs} />
                            }
                        </CardContent>
                    </Card>
                    <Card className="bg-card/80 backdrop-blur-lg">
                       <CardHeader><CardTitle>Top IPs por Actividad</CardTitle></CardHeader>
                       <CardContent>
                           {isLoading ? (
                               <div className="space-y-2 p-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
                           ) : stats && stats.topIps && stats.topIps.length > 0 ? (
                               <div className="space-y-3">
                                   {stats.topIps.map((ipInfo, index) => (
                                       <div key={index} className="flex justify-between items-center text-sm">
                                           <div className="flex items-center gap-2">
                                               <span className="font-mono bg-muted px-2 py-1 rounded-md text-foreground">{ipInfo.ipAddress}</span>
                                           </div>
                                           <span className="font-bold">{ipInfo._count.ipAddress} eventos</span>
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <p className="text-muted-foreground text-center py-8">No hay suficiente actividad de IP para mostrar.</p>
                           )}
                       </CardContent>
                    </Card>
                 </div>
                
                <aside className="lg:col-span-3 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
                    <Card className="bg-card/80 backdrop-blur-lg">
                        <CardHeader>
                            <CardTitle className="text-base">Estadísticas (Últimas 24h)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
                            ) : stats ? (
                                <>
                                    <MetricCard id="successful-logins" title="Inicios Exitosos" value={stats.successfulLogins24h || 0} icon={CheckCircle} />
                                    <MetricCard id="failed-logins" title="Intentos Fallidos" value={stats.failedLogins24h || 0} icon={XCircle} />
                                    <MetricCard id="role-changes" title="Cambios de Rol" value={stats.roleChanges24h || 0} icon={UserCog} />
                                </>
                            ): <div className="text-muted-foreground text-sm text-center p-4">Cargando...</div>}
                        </CardContent>
                    </Card>
                    <DeviceDistributionChart browserData={stats?.browsers} osData={stats?.os} isLoading={isLoading} />
                </aside>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}
