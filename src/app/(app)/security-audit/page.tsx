// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertTriangle, Globe, HelpCircle, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { SecurityLog, SecurityLogEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { startOfDay, subDays } from 'date-fns';
import { SmartPagination } from '@/components/ui/pagination';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { GlobalAccessMap } from '@/components/security/global-access-map';
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

    const fetchLogs = useCallback(async (pageNumber = 1, fetchAll = false) => {
        if (user?.role !== 'ADMINISTRATOR') return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pageNumber),
                pageSize: fetchAll ? '1000' : String(PAGE_SIZE), // Fetch more for the map
            });
            if (filterEvent !== 'ALL') params.set('event', filterEvent);
            if (dateRange.from) params.set('startDate', dateRange.from.toISOString());
            if (dateRange.to) params.set('endDate', dateRange.to.toISOString());
            if (fetchAll) params.set('all', 'true');

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

    useEffect(() => {
        fetchLogs(page, true); // Fetch all logs for the map initially
    }, [page, fetchLogs]);
    
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
                           <DateRangePicker date={dateRange} onDateChange={(range) => { if (range) setDateRange(range); }} />
                      </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Columna Izquierda: Línea de Tiempo */}
                    <main className="lg:col-span-1">
                         <Card id="security-log-timeline">
                            <CardHeader>
                                <CardTitle>Registro de Eventos</CardTitle>
                                <CardDescription>Actividad reciente en la plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                                 logs.length > 0 ? <SecurityLogTimeline logs={logs.slice(0, PAGE_SIZE)} onLogClick={setSelectedLog} /> :
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
                    
                    {/* Columna Derecha: Mapa y Métricas */}
                    <aside className="lg:col-span-2 lg:sticky lg:top-24 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    Mapa de Accesos Global
                                </CardTitle>
                                <CardDescription>Visualización de los eventos de seguridad por ubicación geográfica.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-96 bg-muted/30 rounded-lg overflow-hidden">
                                <GlobalAccessMap accessPoints={logs} />
                            </CardContent>
                        </Card>
                    </aside>
                 </div>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}
