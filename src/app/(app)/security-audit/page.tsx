// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Globe, HelpCircle, CheckCircle, XCircle, UserCog, Monitor, Download, Calendar as CalendarIcon, Server, ShieldX, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { SecurityLog, SecurityStats, SecurityLogEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { startOfDay, subDays } from 'date-fns';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { ExportToCsvButton } from '@/components/ui/export-to-csv';
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalAccessMap } from '@/components/security/global-access-map';
import { SecurityLogTable } from '@/components/security/security-log-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const MetricCard = ({ 
    id, title, value, icon: Icon, onClick,
}: { 
    id: string; title: string; value: number; icon: React.ElementType; onClick?: () => void;
}) => (
    <Card id={id} onClick={onClick} className={onClick ? 'cursor-pointer hover:bg-muted' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function SecurityAuditPage() {
    const { setPageTitle } = useTitle();
    const { user } = useAuth();
    const [allLogs, setAllLogs] = useState<SecurityLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<SecurityLog[]>([]);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
    const [eventFilter, setEventFilter] = useState<SecurityLogEvent | 'ALL'>('ALL');
    
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
            const [logsRes, statsRes] = await Promise.all([
                 fetch('/api/security/logs?all=true'),
                 fetch('/api/security/stats')
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
    }, [user]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
      const filtered = allLogs.filter(log => {
          const logDate = new Date(log.createdAt);
          const isDateInRange = (!dateRange.from || logDate >= dateRange.from) && (!dateRange.to || logDate <= dateRange.to);
          const isEventMatch = eventFilter === 'ALL' || log.event === eventFilter;
          return isDateInRange && isEventMatch;
      });
      setFilteredLogs(filtered);
    }, [allLogs, dateRange, eventFilter]);
    
    const displayedLogs = useMemo(() => filteredLogs.slice(0, 10), [filteredLogs]);

    return (
        <>
           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Monitoriza la actividad, los accesos y los eventos de seguridad de la plataforma.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <ExportToCsvButton data={filteredLogs} filename={`seguridad_${new Date().toISOString().split('T')[0]}`} />
                    <DateRangePicker date={{ from: dateRange.from, to: dateRange.to }} onDateChange={setDateRange} />
                </div>
            </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isLoading ? (
                            <><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></>
                        ) : (
                            <>
                                <MetricCard id="successful-logins" title="Inicios Exitosos (24h)" value={stats?.successfulLogins24h || 0} icon={CheckCircle} onClick={() => setEventFilter('SUCCESSFUL_LOGIN')}/>
                                <MetricCard id="failed-logins" title="Intentos Fallidos (24h)" value={stats?.failedLogins24h || 0} icon={XCircle} onClick={() => setEventFilter('FAILED_LOGIN_ATTEMPT')}/>
                                <MetricCard id="role-changes" title="Cambios de Rol (24h)" value={stats?.roleChanges24h || 0} icon={UserCog} onClick={() => setEventFilter('USER_ROLE_CHANGED')}/>
                            </>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Registro de Eventos</CardTitle>
                             <div className="flex items-center gap-2 pt-2">
                                <Filter className="h-4 w-4 text-muted-foreground"/>
                                 <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as SecurityLogEvent | 'ALL')}>
                                    <SelectTrigger className="w-[280px] h-8 text-xs">
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
                           {isLoading ? <Skeleton className="h-96" /> :
                             error ? <div className="h-96 flex flex-col items-center justify-center text-destructive"><AlertTriangle className="h-6 w-6 mb-2"/>{error}</div> :
                             filteredLogs.length > 0 ? <SecurityLogTable logs={filteredLogs} onRowClick={setSelectedLog} /> :
                             <div className="h-48 flex flex-col items-center justify-center text-muted-foreground"><p>No hay eventos para los filtros seleccionados.</p></div>
                            }
                        </CardContent>
                    </Card>
                </div>
                
                <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
                    <Card className="h-[400px] flex flex-col bg-card/80 backdrop-blur-lg p-0 overflow-hidden">
                         <CardHeader>
                            <CardTitle className="text-base">Mapa de Accesos</CardTitle>
                        </CardHeader>
                         <CardContent className="p-0 flex-grow flex items-center justify-center -mt-8">
                            {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div> :
                             <GlobalAccessMap accessPoints={filteredLogs} />
                            }
                        </CardContent>
                    </Card>
                    <DeviceDistributionChart browserData={stats?.browsers} osData={stats?.os} isLoading={isLoading} />
                </aside>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </>
    );
}
