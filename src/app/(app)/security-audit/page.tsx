// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertTriangle, Globe, Activity, CheckCircle, XCircle, Shield, UserCog, KeyRound, Clock, FileDown, HelpCircle, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { SecurityLog, SecurityLogEvent } from '@/types';
import { getEventDetails } from '@/lib/security-log-utils';
import { Button } from '@/components/ui/button';
import { startOfDay, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SmartPagination } from '@/components/ui/pagination';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { parseUserAgent } from '@/lib/security-log-utils';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { MetricCard } from '@/components/security/metric-card';

export default function SecurityAuditPage() {
    const { setPageTitle } = useTitle();
    const { user } = useAuth();
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
    const [filterEvent, setFilterEvent] = useState<SecurityLogEvent | 'ALL'>('ALL');
    const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 6), to: new Date() });
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const { startTour, forceStartTour } = useTour();
    const PAGE_SIZE = 20;
    
    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const fetchLogs = useCallback(async (pageNumber = 1) => {
        if (user?.role !== 'ADMINISTRATOR') return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pageNumber),
                pageSize: String(PAGE_SIZE),
            });
            if (filterEvent !== 'ALL') params.set('event', filterEvent);
            if (dateRange.from) params.set('startDate', dateRange.from.toISOString());
            if (dateRange.to) params.set('endDate', dateRange.to.toISOString());

            const response = await fetch(`/api/security/logs?${params.toString()}`);
            if (!response.ok) throw new Error('No se pudieron cargar los registros de seguridad.');
            const data = await response.json();
            setLogs(data.logs || []);
            setTotalLogs(data.totalLogs || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, [user, filterEvent, dateRange]);

    const fetchStats = useCallback(async () => {
         if (user?.role !== 'ADMINISTRATOR') return;
        setIsStatsLoading(true);
        try {
            const response = await fetch('/api/security/stats');
            if (!response.ok) throw new Error('No se pudieron cargar las estadísticas.');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch security stats:", err);
        } finally {
            setIsStatsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLogs(page);
    }, [page, fetchLogs]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const deviceData = useMemo(() => {
        if (!logs) return { browsers: [], os: [] };
        const browserCounts = new Map<string, number>();
        const osCounts = new Map<string, number>();

        logs.forEach(log => {
            const { browser, os } = parseUserAgent(log.userAgent);
            browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
            osCounts.set(os, (osCounts.get(os) || 0) + 1);
        });

        const sortAndSlice = (map: Map<string, number>) => Array.from(map.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        return { browsers: sortAndSlice(browserCounts), os: sortAndSlice(osCounts) };
    }, [logs]);
    
    const criticalEvents = useMemo(() => {
        return logs
            .filter(log => log.event === 'FAILED_LOGIN_ATTEMPT' || log.event === 'USER_ROLE_CHANGED')
            .slice(0, 5);
    }, [logs]);

    const handleFilterClick = (eventType: SecurityLogEvent) => {
        setFilterEvent(eventType);
        setPage(1);
    }
    
    const handleExport = () => {
        const headers = "ID,Fecha,Usuario,Email,Evento,Detalles,IP,País,Ciudad,Navegador,SO\n";
        const rows = logs.map(log => {
            const { browser, os } = parseUserAgent(log.userAgent);
            const eventUI = getEventDetails(log.event, log.details);
            const csvRow = [
                log.id,
                format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
                `"${log.user?.name || log.emailAttempt || 'N/A'}"`,
                log.user?.email || 'N/A',
                eventUI.label,
                `"${eventUI.details}"`,
                log.ipAddress,
                log.country,
                log.city,
                browser,
                os
            ].join(',');
            return csvRow;
        }).join('\n');
        
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `auditoria_seguridad_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (user?.role !== 'ADMINISTRATOR' && !isLoading) {
      return (
        <Card className="m-auto mt-10 max-w-lg text-center p-8">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4"/>
            <h2 className="text-xl font-semibold">Acceso Denegado</h2>
            <p className="text-muted-foreground">Esta sección es exclusiva para administradores.</p>
        </Card>
      )
    }

    return (
        <>
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                     <div className="space-y-1">
                        <p className="text-muted-foreground">Monitoriza y analiza la actividad de seguridad de tu plataforma.</p>
                     </div>
                      <div className="flex items-center gap-2 flex-wrap">
                           <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                                <HelpCircle className="mr-2 h-4 w-4" /> Guía Rápida
                            </Button>
                           <Button variant="outline" size="sm" onClick={handleExport} disabled={logs.length === 0}>
                               <FileDown className="mr-2 h-4 w-4"/> Exportar
                           </Button>
                           <DateRangePicker date={dateRange} onDateChange={(range) => { if (range) setDateRange(range); }} />
                      </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <main className="lg:col-span-3">
                         <Card id="security-log-timeline">
                            <CardHeader>
                                <CardTitle>Registro de Eventos Detallado</CardTitle>
                                <CardDescription>Actividad reciente en la plataforma. Haz clic en un evento para ver más detalles.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                                 logs.length > 0 ? <SecurityLogTimeline logs={logs} onLogClick={setSelectedLog} /> :
                                 <div className="h-48 flex flex-col items-center justify-center text-muted-foreground"><p>No hay eventos para el período seleccionado.</p></div>
                                }
                            </CardContent>
                             {totalPages > 1 && (
                                <CardFooter className="pt-4 border-t">
                                   <SmartPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                                </CardFooter>
                            )}
                         </Card>
                    </main>
                    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                        <div className="grid grid-cols-1 gap-4" id="security-stats-cards">
                           <MetricCard id="success-card" title="Inicios Exitosos (24h)" value={stats?.successfulLogins24h || 0} icon={CheckCircle} onClick={() => handleFilterClick('SUCCESSFUL_LOGIN')}/>
                           <MetricCard id="failed-card" title="Intentos Fallidos (24h)" value={stats?.failedLogins24h || 0} icon={XCircle} onClick={() => handleFilterClick('FAILED_LOGIN_ATTEMPT')}/>
                           <MetricCard id="role-card" title="Cambios de Rol (24h)" value={stats?.roleChanges24h || 0} icon={UserCog} onClick={() => handleFilterClick('USER_ROLE_CHANGED')}/>
                        </div>
                        <DeviceDistributionChart browserData={deviceData.browsers} osData={deviceData.os} />
                    </aside>
                 </div>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}