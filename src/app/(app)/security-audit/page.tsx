// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Shield, UserCog, ShieldCheck, HelpCircle, Filter, FileDown, ShieldX } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityStats } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { MetricCard } from '@/components/security/metric-card';
import { SecurityLogTable } from '@/components/security/security-log-table';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { parseUserAgent, getEventDetails } from '@/lib/security-log-utils';
import { SmartPagination } from '@/components/ui/pagination';


const PAGE_SIZE = 15;

const exportToCSV = (logs: AppSecurityLog[], filename = 'security-logs.csv') => {
  if (!logs || logs.length === 0) {
    return;
  }
  const headers = "ID,Evento,Usuario,Email,Dirección IP,Ubicación,Fecha,Navegador,SO,Dispositivo\n";
  const rows = logs.map(log => {
      const { browser, os } = parseUserAgent(log.userAgent);
      const eventInfo = getEventDetails(log.event, log.details);
      
      const csvRow = [
          log.id,
          eventInfo.label,
          `"${log.user?.name || ''}"`,
          log.emailAttempt || log.user?.email,
          log.ipAddress,
          `"${log.city || ''}, ${log.country || ''}"`,
          new Date(log.createdAt).toISOString(),
          browser,
          os,
          log.userAgent
      ].join(',');
      return csvRow;
  }).join('\n');

  const csvContent = headers + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
};


export default function SecurityAuditPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [logs, setLogs] = useState<AppSecurityLog[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
    
    const eventFilter = searchParams.get('event') || 'ALL';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const from = startDateParam ? new Date(startDateParam) : subDays(new Date(), 6);
        const to = endDateParam ? new Date(endDateParam) : new Date();
        return { from: startOfDay(from), to: endOfDay(to) };
    });

    useEffect(() => {
        setPageTitle('Seguridad y Auditoría');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);
    
    const createQueryString = useCallback((paramsToUpdate: Record<string, string | number | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(paramsToUpdate).forEach(([name, value]) => {
            if (value === null || value === '' || value === 'ALL') {
                params.delete(name);
            } else {
                params.set(name, String(value));
            }
        });
        return params.toString();
    }, [searchParams]);

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        router.push(`${pathname}?${createQueryString({ 
            startDate: range?.from ? range.from.toISOString() : null,
            endDate: range?.to ? range.to.toISOString() : null,
            page: 1,
        })}`, { scroll: false });
    };

    const handleEventFilterChange = (value: string) => {
        router.push(`${pathname}?${createQueryString({ event: value, page: 1 })}`, { scroll: false });
    };
    
    const handlePageChange = (page: number) => {
      router.push(`${pathname}?${createQueryString({ page })}`, { scroll: false });
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateRange?.from) params.set('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.set('endDate', dateRange.to.toISOString());
            if (eventFilter !== 'ALL') params.set('event', eventFilter);
            params.set('page', String(currentPage));
            params.set('pageSize', String(PAGE_SIZE));

            const [logsResponse, statsResponse] = await Promise.all([
                fetch(`/api/security/logs?${params.toString()}`),
                fetch(`/api/security/stats`)
            ]);
            
            if (!logsResponse.ok) throw new Error((await logsResponse.json()).message || 'Failed to fetch security logs');
            if (!statsResponse.ok) throw new Error((await statsResponse.json()).message || 'Failed to fetch security stats');
            
            const logsData = await logsResponse.json();
            const statsData = await statsResponse.json();
            
            setLogs(logsData.logs || []);
            setTotalLogs(logsData.totalLogs || 0);
            setStats(statsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, dateRange, eventFilter, currentPage]);
    
    useEffect(() => {
        if (currentUser?.role === 'ADMINISTRATOR') {
            fetchData();
        } else if (currentUser) {
            router.push('/dashboard');
        }
    }, [currentUser, router, fetchData]);
    
    const deviceData = useMemo(() => {
        if (!logs) return { browserData: [], osData: [] };
        const browsers = new Map<string, number>();
        const oses = new Map<string, number>();
        logs.forEach(log => {
            const { browser, os } = parseUserAgent(log.userAgent);
            browsers.set(browser, (browsers.get(browser) || 0) + 1);
            oses.set(os, (oses.get(os) || 0) + 1);
        });
        const browserData = Array.from(browsers.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
        const osData = Array.from(oses.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
        return { browserData, osData };
    }, [logs]);
    
    const criticalEvents = useMemo(() => {
        return logs.filter(log => log.event === 'FAILED_LOGIN_ATTEMPT' || log.event === 'USER_ROLE_CHANGED').slice(0, 5);
    }, [logs]);

    if (!currentUser || currentUser.role !== 'ADMINISTRATOR') {
        return (
            <div className="flex h-full items-center justify-center">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle>Acceso Denegado</CardTitle><CardDescription>Esta página solo está disponible para administradores.</CardDescription></CardHeader>
                    <CardContent><Button asChild><Link href="/dashboard">Volver al Panel Principal</Link></Button></CardContent>
                </Card>
            </div>
        );
    }
    
    if (isLoading && logs.length === 0) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
             <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">Auditoría de Seguridad</h2>
                    <p className="text-muted-foreground">Monitoriza la actividad y la seguridad de tu plataforma.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={eventFilter} onValueChange={handleEventFilterChange}>
                        <SelectTrigger id="security-event-filter" className="w-full sm:w-[200px] h-9"><SelectValue placeholder="Filtrar por evento..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los Eventos</SelectItem>
                            <SelectItem value="SUCCESSFUL_LOGIN">Inicios Exitosos</SelectItem>
                            <SelectItem value="FAILED_LOGIN_ATTEMPT">Intentos Fallidos</SelectItem>
                            <SelectItem value="USER_ROLE_CHANGED">Cambios de Rol</SelectItem>
                            <SelectItem value="PASSWORD_CHANGE_SUCCESS">Cambios de Contraseña</SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} />
                    <Button variant="outline" size="sm" onClick={() => exportToCSV(logs)}><FileDown className="mr-2 h-4 w-4"/>Exportar</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                <div className="lg:col-span-3 space-y-6">
                    <Card id="security-log-table">
                        <CardHeader>
                            <CardTitle>Registro de Eventos Detallado</CardTitle>
                            <CardDescription>Mostrando {logs.length} de {totalLogs} registros.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <SecurityLogTable logs={logs} onRowClick={setSelectedLog} />
                        </CardContent>
                        {totalPages > 1 && (
                            <CardFooter className="pt-4">
                               <SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                            </CardFooter>
                        )}
                    </Card>
                </div>
                <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                     <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                         <MetricCard id="successful-logins-card" title="Inicios Exitosos" value={stats?.successfulLogins24h || 0} icon={ShieldCheck} onClick={() => handleEventFilterChange('SUCCESSFUL_LOGIN')} />
                         <MetricCard id="failed-logins-card" title="Intentos Fallidos" value={stats?.failedLogins24h || 0} icon={ShieldX} onClick={() => handleEventFilterChange('FAILED_LOGIN_ATTEMPT')} />
                         <MetricCard id="role-changes-card" title="Cambios de Rol" value={stats?.roleChanges24h || 0} icon={UserCog} onClick={() => handleEventFilterChange('USER_ROLE_CHANGED')} />
                     </div>
                     <DeviceDistributionChart browserData={deviceData.browserData} osData={deviceData.osData} />
                     <Card>
                         <CardHeader>
                             <CardTitle className="text-base flex items-center gap-2">Eventos Críticos Recientes</CardTitle>
                         </CardHeader>
                         <CardContent>
                            {criticalEvents.length > 0 ? (
                               <div className="space-y-3">
                                {criticalEvents.map(log => {
                                    const eventUI = getEventDetails(log.event, log.details);
                                    return (
                                        <div key={log.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted" onClick={() => setSelectedLog(log)}>
                                            {eventUI.icon}
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold truncate">{log.user?.name || log.emailAttempt}</p>
                                                <p className="text-xs text-muted-foreground">{eventUI.label}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                               </div>
                            ) : <p className="text-sm text-center text-muted-foreground py-4">No hay eventos críticos recientes.</p>}
                         </CardContent>
                    </Card>
                </aside>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}
