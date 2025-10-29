// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, UserCog, HelpCircle, Filter, CheckCircle, Shield, BookMarked, Percent, Users, UserX } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityStats, User, SecurityLogEvent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import { useTitle } from '@/contexts/title-context';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfDay, endOfDay, isValid } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { SecurityLogTimeline } from '@/components/security/security-log-timeline';
import { SecurityLogDetailSheet } from '@/components/security/security-log-detail-sheet';
import { DeviceDistributionChart } from '@/components/security/device-distribution-chart';
import { TopIpsCard } from '@/components/security/top-ips-card';
import { GaugeChart } from '@/components/ui/gauge';
import { Skeleton } from '@/components/ui/skeleton';
import { SmartPagination } from '@/components/ui/pagination';
import { MetricCard } from '@/components/analytics/metric-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { AtRiskUsersCard } from '@/components/security/at-risk-users-card';
import { VisitorsByCountryCard } from '@/components/security/visitors-by-country-card';


const PAGE_SIZE = 10;

const ALL_EVENTS: { value: SecurityLogEvent | 'ALL' | 'COURSE_MODIFICATIONS', label: string }[] = [
    { value: 'ALL', label: 'Todos los Eventos' },
    { value: 'SUCCESSFUL_LOGIN', label: 'Inicios de Sesión Exitosos' },
    { value: 'FAILED_LOGIN_ATTEMPT', label: 'Inicios de Sesión Fallidos' },
    { value: 'PASSWORD_CHANGE_SUCCESS', label: 'Cambios de Contraseña' },
    { value: 'USER_ROLE_CHANGED', label: 'Cambios de Rol' },
    { value: 'COURSE_MODIFICATIONS', label: 'Modificaciones de Cursos' },
    { value: 'USER_SUSPENDED', label: 'Usuarios Suspendidos' },
    { value: 'TWO_FACTOR_ENABLED', label: 'Activaciones de 2FA' },
    { value: 'TWO_FACTOR_DISABLED', label: 'Desactivaciones de 2FA' },
];

function SecurityAuditPageComponent() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [logs, setLogs] = useState<AppSecurityLog[]>([]);
    const [stats, setStats] = useState<Partial<SecurityStats>>({});
    const [totalLogs, setTotalLogs] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<AppSecurityLog | null>(null);
    const [userToSuspend, setUserToSuspend] = useState<any>(null);
    const [isSuspending, setIsSuspending] = useState(false);
    
    const activeFilter = searchParams.get('event') || 'ALL';
    const currentPage = Number(searchParams.get('page')) || 1;
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
    });
    
    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const createQueryString = useCallback((params: Record<string, string | number | null>) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        for (const key in params) {
            const value = params[key];
            if (value === null || value === '' || value === 'ALL') {
                currentParams.delete(key);
            } else {
                currentParams.set(key, String(value));
            }
        }
        return currentParams.toString();
    }, [searchParams]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateRange?.from) params.set('startDate', dateRange.from.toISOString());
            if (dateRange?.to) params.set('endDate', dateRange.to.toISOString());
            if (activeFilter && activeFilter !== 'ALL') params.set('event', activeFilter);
            params.set('page', String(currentPage));
            
            const response = await fetch(`/api/security/logs?${params.toString()}`);
            
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || "Failed to fetch security data");
            }
            
            const data = await response.json();
            
            setLogs(data.logs || []);
            setStats(data.stats || {});
            setTotalLogs(data.totalLogs || 0);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching data';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, dateRange, activeFilter, currentPage]);
    
    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchData();
    }, [currentUser, router, fetchData]);

    const handleFilterChange = (key: 'event' | 'date', value: string | DateRange | undefined | null) => {
        let paramsToUpdate: Record<string, string | number | null> = { page: 1 };
        
        if (key === 'date') {
            setDateRange(value as DateRange);
        } else {
            paramsToUpdate['event'] = value as string;
        }
        
        const newQuery = createQueryString(paramsToUpdate);
        router.push(`${pathname}?${newQuery}`);
    };
    
    const handlePageChange = (page: number) => {
        const newQuery = createQueryString({ page });
        router.push(`${pathname}?${newQuery}`);
    }

    const handleSuspendUser = async () => {
        if (!userToSuspend) return;
        setIsSuspending(true);
        try {
            const res = await fetch(`/api/users/${userToSuspend.userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: false })
            });
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudo suspender al usuario.');
            
            toast({ title: "Usuario Suspendido", description: `${userToSuspend.name || userToSuspend.email} ha sido suspendido.`});
            fetchData(); // Refresh data
        } catch(err) {
             toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsSuspending(false);
            setUserToSuspend(null);
        }
    }

    if (currentUser?.role !== 'ADMINISTRATOR') {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold">Auditoría de Seguridad</h1>
                    <p className="text-muted-foreground">Analiza la actividad de seguridad de tu plataforma.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <DateRangePicker date={dateRange} onDateChange={(range) => handleFilterChange('date', range)} />
                     <Select value={activeFilter} onValueChange={(v) => handleFilterChange('event', v)}>
                        <SelectTrigger className="w-full sm:w-[220px]" id="security-event-filter">
                            <SelectValue placeholder="Filtrar por evento"/>
                        </SelectTrigger>
                        <SelectContent>
                            {ALL_EVENTS.map(event => (<SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                        <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                    </Button>
                </div>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Columna Izquierda */}
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse"/>Línea de Tiempo de Eventos</CardTitle>
                            <CardDescription className="text-xs">Es como la cámara de seguridad. Registra cada vez que alguien entra, sale o realiza una acción importante.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto"/></div>
                            : error ? (
                                <div className="text-center py-8 text-destructive flex flex-col items-center gap-2">
                                    <AlertTriangle className="h-6 w-6"/>
                                    <p className="font-semibold">{error}</p>
                                    <Button variant="outline" size="sm" onClick={fetchData}>Reintentar</Button>
                                </div>
                            )
                            : logs.length === 0 ? <p className="text-center text-muted-foreground py-8">No hay registros para los filtros seleccionados.</p>
                            : <SecurityLogTimeline logs={logs} onLogClick={setSelectedLog} />
                            }
                        </CardContent>
                         {totalPages > 1 && (
                            <CardFooter>
                                <SmartPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                            </CardFooter>
                         )}
                    </Card>
                    <AtRiskUsersCard users={stats.atRiskUsers || []} onSuspend={setUserToSuspend} isLoading={isLoading} />
                </div>
                 {/* Columna Central */}
                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary"/> Salud de Seguridad</CardTitle>
                             <CardDescription className="text-xs">Un "termómetro" que mide qué tan seguros son los inicios de sesión. Un puntaje alto es bueno.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            {isLoading ? <Skeleton className="h-48 w-full"/> : <GaugeChart value={stats.securityScore || 0}/>}
                             <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                                <MetricCard id="successful-logins-card" title="Exitosos" value={stats.successfulLogins || 0} icon={CheckCircle} onClick={() => handleFilterChange('event', 'SUCCESSFUL_LOGIN')} gradient="bg-gradient-green" />
                                <MetricCard id="failed-logins-card" title="Fallidos" value={stats.failedLogins || 0} icon={AlertTriangle} onClick={() => handleFilterChange('event', 'FAILED_LOGIN_ATTEMPT')} gradient="bg-gradient-orange" />
                                <MetricCard id="content-mods-card" title="Modif. Contenido" value={stats.courseModifications || 0} icon={BookMarked} onClick={() => handleFilterChange('event', 'COURSE_MODIFICATIONS')} gradient="bg-gradient-blue" />
                                <MetricCard id="2fa-adoption-card" title="Adopción 2FA" value={stats.twoFactorAdoptionRate || 0} icon={Percent} suffix="%" gradient="bg-gradient-purple" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                 {/* Columna Derecha */}
                <div className="lg:col-span-1 space-y-8">
                    <DeviceDistributionChart browserData={stats?.browsers} osData={stats?.os} isLoading={isLoading}/>
                    <TopIpsCard topIps={stats?.topIps || []} isLoading={isLoading}/>
                    <VisitorsByCountryCard topCountries={stats?.topCountries || []} isLoading={isLoading} />
                </div>
            </div>
            
            {selectedLog && <SecurityLogDetailSheet log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />}
            
            <AlertDialog open={!!userToSuspend} onOpenChange={setUserToSuspend}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar Suspensión?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto inactivará la cuenta del usuario <strong>{userToSuspend?.name || userToSuspend?.email}</strong>. El usuario no podrá iniciar sesión hasta que un administrador reactive su cuenta manualmente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSuspending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSuspendUser} disabled={isSuspending} className={cn(buttonVariants({ variant: 'destructive' }))}>
                            {isSuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Suspender Usuario
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default function SecurityAuditPageWrapper() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SecurityAuditPageComponent />
        </Suspense>
    );
}
