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
import { getEventDetails } from '@/lib/security-log-utils';

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
    const [activeFilter, setActiveFilter] = useState<SecurityLogEvent | 'ALL'>('ALL');
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
            if (activeFilter !== 'ALL') {
                params.set('event', activeFilter);
            }
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
    }, [user, activeFilter]);

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
            </>
        );
         return () => setHeaderActions(null);
    }, [setHeaderActions, forceStartTour]);

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
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Columna Principal (Timeline) */}
                    <div className="lg:col-span-3">
                         <Card id="security-log-timeline">
                            <CardHeader>
                                <CardTitle>Registro de Eventos</CardTitle>
                                <CardDescription>Actividad reciente en la plataforma. Haz clic en un evento para ver los detalles.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingLogs ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                                 logs.length > 0 ? <SecurityLogTimeline logs={logs} onLogClick={setSelectedLog} /> :
                                 <div className="h-48 flex flex-col items-center justify-center text-muted-foreground"><p>No hay eventos para mostrar.</p></div>
                                }
                            </CardContent>
                             {totalPages > 1 && (
                                <CardFooter className="pt-4 border-t">
                                   <SmartPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                </CardFooter>
                            )}
                         </Card>
                    </div>

                    {/* Columna Lateral: Métricas y Resúmenes */}
                    <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
                        {isStatsLoading ? (
                            <div className="space-y-4">
                               <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
                               <Skeleton className="h-48" />
                               <Skeleton className="h-64" />
                            </div>
                        ) : stats ? (
                             <>
                                <MetricCard 
                                    id="successful-logins"
                                    title="Inicios Exitosos (24h)"
                                    value={stats.successfulLogins24h || 0}
                                    icon={CheckCircle}
                                    onClick={() => setActiveFilter('SUCCESSFUL_LOGIN')}
                                />
                                <MetricCard 
                                    id="failed-logins"
                                    title="Intentos Fallidos (24h)"
                                    value={stats.failedLogins24h || 0}
                                    icon={XCircle}
                                    onClick={() => setActiveFilter('FAILED_LOGIN_ATTEMPT')}
                                />
                                 <MetricCard 
                                    id="role-changes"
                                    title="Cambios de Rol (24h)"
                                    value={stats.roleChanges24h || 0}
                                    icon={UserCog}
                                    onClick={() => setActiveFilter('USER_ROLE_CHANGED')}
                                />
                                <DeviceDistributionChart browserData={stats.browsers} osData={stats.os} />
                                 <Card id="critical-events">
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
                                                             <div className="p-1.5 bg-muted rounded-full">{eventUI.icon}</div>
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
                            </>
                        ): null}
                    </aside>
                 </div>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}
