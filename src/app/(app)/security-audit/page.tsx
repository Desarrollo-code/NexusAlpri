// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Shield, UserCog, ShieldCheck, MapIcon, HelpCircle } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityStats } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { AnimatedGlobe } from '@/components/analytics/animated-globe';
import { MetricCard } from '@/components/security/metric-card';
import { SecurityLogTable } from '@/components/security/security-log-table';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { parseUserAgent } from '@/lib/security-log-utils';

export default function SecurityAuditPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [logs, setLogs] = useState<AppSecurityLog[]>([]);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
    
    const eventFilter = searchParams.get('event') || 'ALL';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

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
        })}`, { scroll: false });
    };

    const handleEventFilterChange = (value: string) => {
        router.push(`${pathname}?${createQueryString({ event: value })}`, { scroll: false });
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateRange?.from) params.set('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.set('endDate', dateRange.to.toISOString());
            if (eventFilter !== 'ALL') params.set('event', eventFilter);

            const [logsResponse, statsResponse] = await Promise.all([
                fetch(`/api/security/logs?${params.toString()}`),
                fetch(`/api/security/stats`)
            ]);
            
            if (!logsResponse.ok) throw new Error((await logsResponse.json()).message || 'Failed to fetch security logs');
            if (!statsResponse.ok) throw new Error((await statsResponse.json()).message || 'Failed to fetch security stats');
            
            const logsData = await logsResponse.json();
            const statsData = await statsResponse.json();
            
            setLogs(logsData.logs || []);
            setStats(statsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, dateRange, eventFilter]);
    
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

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold">Error al Cargar Datos</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchData} className="mt-4">Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-muted-foreground">Monitoriza la actividad y la seguridad de tu plataforma.</p></div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={eventFilter} onValueChange={handleEventFilterChange}>
                        <SelectTrigger className="w-full sm:w-[200px] h-9"><SelectValue placeholder="Filtrar por evento..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los Eventos</SelectItem>
                            <SelectItem value="SUCCESSFUL_LOGIN">Inicios Exitosos</SelectItem>
                            <SelectItem value="FAILED_LOGIN_ATTEMPT">Intentos Fallidos</SelectItem>
                            <SelectItem value="USER_ROLE_CHANGED">Cambios de Rol</SelectItem>
                            <SelectItem value="PASSWORD_CHANGE_SUCCESS">Cambios de Contraseña</SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} />
                    <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}><HelpCircle className="mr-2 h-4 w-4" /> Guía</Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                 <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <MetricCard id="successful-logins-card" title="Inicios Exitosos" value={stats?.successfulLogins24h || 0} icon={ShieldCheck} trendData={stats?.loginsLast7Days || []} gradient="bg-gradient-green" onClick={() => handleEventFilterChange('SUCCESSFUL_LOGIN')} />
                    <MetricCard id="failed-logins-card" title="Intentos Fallidos" value={stats?.failedLogins24h || 0} icon={AlertTriangle} gradient="bg-gradient-orange" onClick={() => handleEventFilterChange('FAILED_LOGIN_ATTEMPT')} />
                    <MetricCard id="role-changes-card" title="Cambios de Rol" value={stats?.roleChanges24h || 0} icon={UserCog} gradient="bg-gradient-blue" onClick={() => handleEventFilterChange('USER_ROLE_CHANGED')} />
                </div>
                <div className="md:col-span-2">
                    <DeviceDistributionChart browserData={deviceData.browserData} osData={deviceData.osData} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-3">
                    <Card><CardHeader><CardTitle>Registro de Eventos Detallado</CardTitle></CardHeader><CardContent><SecurityLogTable logs={logs} onRowClick={setSelectedLog}/></CardContent></Card>
                </div>
                <div className="md:col-span-2">
                    <Card id="access-map" className="h-full"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapIcon className="h-5 w-5 text-primary"/>Mapa de Accesos</CardTitle></CardHeader><CardContent className="h-full min-h-[300px] flex flex-col items-center justify-center"><AnimatedGlobe /><h3 className="font-semibold text-lg text-foreground mt-4">Próximamente</h3><p className="text-sm text-muted-foreground">Visualización geográfica de inicios de sesión.</p></CardContent></Card>
                </div>
            </div>
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}
