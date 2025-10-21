// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertTriangle, Globe, HelpCircle, Filter, CheckCircle, XCircle, UserCog, Monitor, Download, Calendar as CalendarIcon, Server, ShieldX } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { getEventDetails } from '@/lib/security-log-utils';

export default function SecurityAuditPage() {
    const { setPageTitle } = useTitle();
    const { user } = useAuth();
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [logError, setLogError] = useState<string | null>(null);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
    
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: subDays(new Date(), 6), to: new Date() });
    
    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
    }, [setPageTitle]);

    const fetchLogs = useCallback(async () => {
        if (user?.role !== 'ADMINISTRATOR') return;
        setIsLoadingLogs(true);
        setLogError(null);
        try {
            const params = new URLSearchParams();
            if (dateRange.from) params.set('startDate', startOfDay(dateRange.from).toISOString());
            if (dateRange.to) params.set('endDate', startOfDay(dateRange.to).toISOString());
            
            const response = await fetch(`/api/security/logs?all=true&${params.toString()}`);
            if (!response.ok) throw new Error('No se pudieron cargar los registros.');
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (err) {
            setLogError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoadingLogs(false);
        }
    }, [user, dateRange]);

    const fetchStats = useCallback(async () => {
        if (user?.role !== 'ADMINISTRATOR') return;
        setIsStatsLoading(true);
        setStatsError(null);
        try {
             const response = await fetch('/api/security/stats');
             if (!response.ok) throw new Error('No se pudieron cargar las estadísticas.');
             const data = await response.json();
             setStats(data);
        } catch(err) {
            setStatsError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsStatsLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [fetchLogs, fetchStats]);
    
    const criticalEvents = useMemo(() => {
        return logs
            .filter(log => log.event === 'FAILED_LOGIN_ATTEMPT' || log.event === 'USER_ROLE_CHANGED')
            .slice(0, 5);
    }, [logs]);

    return (
        <>
           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Monitoriza la actividad, los accesos y los eventos de seguridad de la plataforma.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <ExportToCsvButton data={logs} filename={`seguridad_${new Date().toISOString().split('T')[0]}`} />
                    <DateRangePicker date={{ from: dateRange.from, to: dateRange.to }} onDateChange={setDateRange} />
                </div>
            </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <div className="lg:col-span-4 xl:col-span-3">
                    <Card id="security-log-timeline" className="bg-card/80 backdrop-blur-lg">
                        <CardHeader>
                            <CardTitle>Registro de Eventos</CardTitle>
                            <CardDescription>Actividad reciente en la plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingLogs ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                             logError ? <div className="h-96 flex flex-col items-center justify-center text-destructive"><AlertTriangle className="h-6 w-6 mb-2"/>{logError}</div> :
                             logs.length > 0 ? <SecurityLogTimeline logs={logs} onLogClick={setSelectedLog} /> :
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
                            <GlobalAccessMap accessPoints={logs} />
                        </CardContent>
                    </Card>
                    <Card className="bg-card/80 backdrop-blur-lg">
                       <CardHeader><CardTitle>Top IPs por Actividad</CardTitle></CardHeader>
                       <CardContent>
                           {isStatsLoading ? (
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
                            {isStatsLoading ? (
                                <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
                            ) : statsError ? (
                                <div className="text-destructive text-sm text-center p-4 bg-destructive/10 rounded-md">No se pudieron cargar las estadísticas.</div>
                            ) : stats ? (
                                <>
                                    <MetricCard id="successful-logins" title="Inicios Exitosos" value={stats.successfulLogins24h || 0} icon={CheckCircle} />
                                    <MetricCard id="failed-logins" title="Intentos Fallidos" value={stats.failedLogins24h || 0} icon={XCircle} />
                                    <MetricCard id="role-changes" title="Cambios de Rol" value={stats.roleChanges24h || 0} icon={UserCog} />
                                </>
                            ): null}
                        </CardContent>
                    </Card>
                    <DeviceDistributionChart browserData={stats?.browsers} osData={stats?.os} />
                     <Card id="critical-events" className="bg-card/80 backdrop-blur-lg">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive"/> Eventos Críticos Recientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {criticalEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {criticalEvents.map(log => {
                                        const eventUI = getEventDetails(log.event, log.details);
                                        return (
                                            <div key={log.id} className="flex items-center gap-3 text-sm">
                                                 <div className="p-1.5 bg-muted rounded-full">{React.cloneElement(eventUI.icon, { className: "h-4 w-4"})}</div>
                                                 <div>
                                                    <p className="font-semibold">{log.user?.name || log.emailAttempt}</p>
                                                    <p className="text-xs text-muted-foreground">{eventUI.label}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-center text-muted-foreground py-4">No hay eventos críticos recientes.</p>
                            )}
                        </CardContent>
                    </Card>
                </aside>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}
