// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertTriangle, Globe, HelpCircle, Filter, CheckCircle, XCircle, UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { SecurityLog, SecurityLogEvent, SecurityStats } from '@/types';
import { Button } from '@/components/ui/button';
import { startOfDay, subDays } from 'date-fns';
import { SmartPagination } from '@/components/ui/pagination';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { MetricCard } from '@/components/security/metric-card';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';

const PAGE_SIZE = 20;

export default function SecurityAuditPage() {
    const { setPageTitle, setHeaderActions } = useTitle();
    const { user } = useAuth();
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
    
    const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 6), to: new Date() });
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const { startTour, forceStartTour } = useTour();
    
    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    useEffect(() => {
        setPageTitle('Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const fetchLogs = useCallback(async (pageNumber = 1) => {
        if (user?.role !== 'ADMINISTRATOR') return;
        setIsLoadingLogs(true);
        try {
            const params = new URLSearchParams({
                page: String(pageNumber),
                pageSize: String(PAGE_SIZE),
            });
            const response = await fetch(`/api/security/logs?${params.toString()}`);
            if (!response.ok) throw new Error('No se pudieron cargar los registros.');
            const data = await response.json();
            setLogs(data.logs || []);
            setTotalLogs(data.totalLogs || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoadingLogs(false);
        }
    }, [user]);

    const fetchStats = useCallback(async () => {
        if (user?.role !== 'ADMINISTRATOR') return;
        setIsStatsLoading(true);
        try {
             const response = await fetch('/api/security/stats');
             if (!response.ok) throw new Error('No se pudieron cargar las estadísticas.');
             const data = await response.json();
             setStats(data);
        } catch(err) {
            // Silently fail on stats
        } finally {
            setIsStatsLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        setHeaderActions(
            <>
                <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Guía Rápida
                </Button>
                <Button variant="outline" size="sm">Exportar CSV</Button>
                <DateRangePicker date={dateRange} onDateChange={(range) => { if (range) setDateRange(range); }} />
            </>
        );
         return () => setHeaderActions(null);
    }, [setHeaderActions, dateRange, forceStartTour]);

    useEffect(() => {
        fetchLogs(page);
        fetchStats();
    }, [page, fetchLogs, fetchStats]);
    
    const criticalEvents = useMemo(() => {
        return logs
            .filter(log => log.event === 'FAILED_LOGIN_ATTEMPT' || log.event === 'USER_ROLE_CHANGED')
            .slice(0, 5);
    }, [logs]);


    return (
        <>
            <div className="space-y-6">
                 <p className="text-muted-foreground">Monitoriza y analiza la actividad de seguridad de tu plataforma.</p>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {/* Columna Izquierda: Timeline */}
                    <div className="lg:col-span-2 xl:col-span-1">
                         <Card id="security-log-timeline">
                            <CardHeader>
                                <CardTitle>Registro de Eventos</CardTitle>
                                <CardDescription>Actividad reciente en la plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingLogs ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                                 logs.length > 0 ? <SecurityLogTimeline logs={logs} onLogClick={setSelectedLog} /> :
                                 <div className="h-48 flex flex-col items-center justify-center text-muted-foreground"><p>No hay eventos.</p></div>
                                }
                            </CardContent>
                             {totalPages > 1 && (
                                <CardFooter className="pt-4 border-t">
                                   <SmartPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                </CardFooter>
                            )}
                         </Card>
                    </div>

                    {/* Columna Central: Globo y Lista de IPs */}
                     <div className="lg:col-span-1 xl:col-span-2 space-y-6">
                        <Card className="h-[400px] flex items-center justify-center border-dashed">
                             <CardContent className="text-center text-muted-foreground">
                                <h3 className="text-lg font-semibold text-foreground">Aquí va el GLOBO TERRAQUEO</h3>
                             </CardContent>
                        </Card>
                         <Card className="h-[300px] flex items-center justify-center border-dashed">
                             <CardContent className="text-center text-muted-foreground">
                                 <h3 className="text-lg font-semibold text-foreground">LISTA DE IPS</h3>
                             </CardContent>
                        </Card>
                    </div>
                    
                    {/* Columna Derecha: Métricas y Resúmenes */}
                    <aside className="lg:col-span-3 xl:col-span-1 lg:sticky lg:top-24 space-y-6">
                        {isStatsLoading ? (
                            <div className="space-y-4">
                               <div className="space-y-2"><div className="h-20 rounded-lg bg-muted animate-pulse"></div><div className="h-20 rounded-lg bg-muted animate-pulse"></div><div className="h-20 rounded-lg bg-muted animate-pulse"></div></div>
                               <div className="h-48 rounded-lg bg-muted animate-pulse"></div>
                               <div className="h-64 rounded-lg bg-muted animate-pulse"></div>
                            </div>
                        ) : stats ? (
                             <>
                                <MetricCard 
                                    id="successful-logins"
                                    title="Inicios Exitosos (24h)"
                                    value={stats.successfulLogins24h || 0}
                                    icon={CheckCircle}
                                />
                                <MetricCard 
                                    id="failed-logins"
                                    title="Intentos Fallidos (24h)"
                                    value={stats.failedLogins24h || 0}
                                    icon={XCircle}
                                />
                                 <MetricCard 
                                    id="role-changes"
                                    title="Cambios de Rol (24h)"
                                    value={stats.roleChanges24h || 0}
                                    icon={UserCog}
                                />
                                <DeviceDistributionChart browserData={stats.browsers} osData={stats.os} />
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-destructive"/> Eventos Críticos Recientes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {criticalEvents.length > 0 ? (
                                            <div className="space-y-3">
                                                {criticalEvents.map(log => (
                                                    <div key={log.id} className="flex items-center gap-3 text-sm">
                                                         <div>
                                                            <p className="font-semibold">{log.user?.name || log.emailAttempt}</p>
                                                            <p className="text-xs text-muted-foreground">{getEventDetails(log.event).label}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground py-4">No hay eventos críticos recientes.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        ): null}
                    </aside>
                 </div>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}
