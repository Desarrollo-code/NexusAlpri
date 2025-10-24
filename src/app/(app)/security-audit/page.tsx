// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTitle } from '@/contexts/title-context';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, AlertTriangle, CheckCircle, XCircle, UserCog, Filter, HelpCircle } from 'lucide-react';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { SecurityLog, SecurityStats, SecurityLogEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { startOfDay, subDays, endOfDay } from 'date-fns';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { ExportToCsvButton } from '@/components/ui/export-to-csv';
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalAccessMap } from '@/components/security/global-access-map';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '@/components/security/metric-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Separator } from '@/components/ui/separator';

export default function SecurityAuditPage() {
    const { setPageTitle } = useTitle();
    const { user } = useAuth();
    const [allLogs, setAllLogs] = useState<SecurityLog[]>([]);
    const [stats, setStats] = useState<Partial<SecurityStats> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
    const [eventFilter, setEventFilter] = useState<SecurityLogEvent | 'ALL'>('ALL');
    const { startTour, forceStartTour } = useTour();
    
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: subDays(new Date(), 6), to: new Date() });
    const debouncedDateRange = useDebounce(dateRange, 500);
    
    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const fetchData = useCallback(async () => {
        if (user?.role !== 'ADMINISTRATOR') {
             setIsLoading(false);
             setError("Acceso denegado.");
             return;
        };
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (debouncedDateRange?.from) params.set('startDate', startOfDay(debouncedDateRange.from).toISOString());
        if (debouncedDateRange?.to) params.set('endDate', endOfDay(debouncedDateRange.to).toISOString());
        if (eventFilter && eventFilter !== 'ALL') params.set('event', eventFilter);

        try {
            const [logsRes, statsRes] = await Promise.all([
                 fetch(`/api/security/logs?${params.toString()}`),
                 fetch(`/api/security/stats?${params.toString()}`)
            ]);
            
            if (!logsRes.ok) throw new Error('No se pudieron cargar los registros de seguridad.');
            if (!statsRes.ok) throw new Error('No se pudieron cargar las estadísticas de seguridad.');

            const logsData = await logsRes.json();
            const statsData = await statsRes.json();
            
            setAllLogs(logsData.logs || []);
            setStats(statsData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, [user, debouncedDateRange, eventFilter]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const metricCards = useMemo(() => [
        { id: 'successful-logins', title: 'Inicios Exitosos', value: stats?.successfulLogins || 0, icon: CheckCircle, event: 'SUCCESSFUL_LOGIN' },
        { id: 'failed-logins', title: 'Intentos Fallidos', value: stats?.failedLogins || 0, icon: XCircle, event: 'FAILED_LOGIN_ATTEMPT' },
        { id: 'role-changes', title: 'Cambios de Rol', value: stats?.roleChanges || 0, icon: UserCog, event: 'USER_ROLE_CHANGED' },
    ], [stats]);

    return (
        <>
           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Monitoriza la actividad y los eventos de seguridad de la plataforma.</p>
                </div>
                 <div className="flex flex-wrap items-center gap-2">
                    <ExportToCsvButton data={allLogs} filename={`seguridad_${new Date().toISOString().split('T')[0]}`} />
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                     <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                        <HelpCircle className="mr-2 h-4 w-4" /> Guía
                    </Button>
                </div>
            </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <div id="security-stats-cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isLoading ? (
                            <><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></>
                        ) : (
                            metricCards.map(card => (
                                <MetricCard 
                                    key={card.id}
                                    id={card.id}
                                    title={card.title} 
                                    value={card.value} 
                                    icon={card.icon} 
                                    onClick={() => setEventFilter(card.event as SecurityLogEvent)}
                                />
                            ))
                        )}
                    </div>
                    
                    <Card id="security-log-table">
                        <CardHeader>
                            <CardTitle>Línea de Tiempo de Eventos</CardTitle>
                             <div className="flex items-center gap-2 pt-2" id="security-event-filter">
                                <Filter className="h-4 w-4 text-muted-foreground"/>
                                 <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as SecurityLogEvent | 'ALL')}>
                                    <SelectTrigger className="w-[280px] h-9 text-sm">
                                        <SelectValue placeholder="Filtrar por evento..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todos los Eventos</SelectItem>
                                        <Separator />
                                        <SelectItem value="SUCCESSFUL_LOGIN">Inicio Exitoso</SelectItem>
                                        <SelectItem value="FAILED_LOGIN_ATTEMPT">Intento Fallido</SelectItem>
                                        <SelectItem value="PASSWORD_CHANGE_SUCCESS">Cambio de Contraseña</SelectItem>
                                        <SelectItem value="USER_ROLE_CHANGED">Cambio de Rol</SelectItem>
                                        <SelectItem value="TWO_FACTOR_ENABLED">2FA Activado</SelectItem>
                                        <SelectItem value="TWO_FACTOR_DISABLED">2FA Desactivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                           {isLoading ? <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                             error ? <div className="h-96 flex flex-col items-center justify-center text-destructive"><AlertTriangle className="h-6 w-6 mb-2"/>{error}</div> :
                             allLogs.length > 0 ? <SecurityLogTimeline logs={allLogs} onLogClick={setSelectedLog} /> :
                             <div className="h-48 flex flex-col items-center justify-center text-muted-foreground"><p>No hay eventos para los filtros seleccionados.</p></div>
                            }
                        </CardContent>
                    </Card>
                </div>
                
                <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
                    <GlobalAccessMap accessPoints={allLogs} />
                    <DeviceDistributionChart browserData={stats?.browsers} osData={stats?.os} isLoading={isLoading} />
                </aside>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}