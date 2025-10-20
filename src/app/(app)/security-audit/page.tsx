// src/app/(app)/security-audit/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Monitor, HelpCircle, AlertTriangle, Shield, Clock, UserCog, Map as MapIcon, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, User as AppUser, SecurityLogEvent, SecurityStats } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { getEventDetails, parseUserAgent } from '@/lib/security-log-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTitle } from '@/contexts/title-context';
import { Identicon } from '@/components/ui/identicon';
import { useTour } from '@/contexts/tour-context';
import { securityAuditTour } from '@/lib/tour-steps';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '@/components/analytics/metric-card';
import { DeviceDistributionChart } from '@/components/analytics/security-charts';
import { AnimatedGlobe } from '@/components/analytics/animated-globe';

interface SecurityLogWithUser extends AppSecurityLog {
    user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

export default function SecurityAuditPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();
    const { startTour, forceStartTour } = useTour();

    const [logs, setLogs] = useState<SecurityLogWithUser[]>([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [stats, setStats] = useState<SecurityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deviceData, setDeviceData] = useState<{ browserData: any[], osData: any[] } | null>(null);
    
    useEffect(() => {
        setPageTitle('Seguridad');
        startTour('securityAudit', securityAuditTour);
    }, [setPageTitle, startTour]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [logsResponse, statsResponse] = await Promise.all([
                fetch(`/api/security/logs?all=true`),
                fetch('/api/security/stats')
            ]);
            
            if (!logsResponse.ok) throw new Error((await logsResponse.json()).message || 'Failed to fetch security logs');
            if (!statsResponse.ok) throw new Error((await statsResponse.json()).message || 'Failed to fetch security stats');
            
            const logsData = await logsResponse.json();
            const statsData = await statsResponse.json();

            setLogs(logsData.logs || []);
            setTotalLogs(logsData.totalLogs || 0);
            setStats(statsData);

            if (logsData.logs) {
                const browsers = new Map<string, number>();
                const oses = new Map<string, number>();

                logsData.logs.forEach((log: SecurityLogWithUser) => {
                    const { browser, os } = parseUserAgent(log.userAgent);
                    if (browser !== 'Desconocido') browsers.set(browser, (browsers.get(browser) || 0) + 1);
                    if (os !== 'Desconocido') oses.set(os, (oses.get(os) || 0) + 1);
                });
                
                const browserData = Array.from(browsers.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
                const osData = Array.from(oses.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
                setDeviceData({ browserData, osData });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        if (currentUser?.role === 'ADMINISTRATOR') {
            fetchData();
        } else if (currentUser) {
             router.push('/dashboard');
        }
    }, [currentUser, router, fetchData]);
    
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
             <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Monitoriza la actividad y la seguridad de tu plataforma.</p>
                <Button variant="outline" size="sm" onClick={() => forceStartTour('securityAudit', securityAuditTour)}>
                    <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Fila 1: Métricas y Gráficos */}
                <MetricCard id="successful-logins-card" title="Inicios Exitosos" value={stats?.successfulLogins24h || 0} icon={ShieldCheck} description="Últimas 24h" trendData={stats?.loginsLast7Days || []} dataKey="count" gradient="bg-gradient-green" color="hsl(var(--chart-2))" className="lg:col-span-1"/>
                <MetricCard id="failed-logins-card" title="Intentos Fallidos" value={stats?.failedLogins24h || 0} icon={AlertTriangle} description="Últimas 24h" gradient="bg-gradient-orange" color="hsl(var(--chart-4))" className="lg:col-span-1"/>
                <MetricCard id="role-changes-card" title="Cambios de Rol" value={stats?.roleChanges24h || 0} icon={UserCog} description="Últimas 24h" gradient="bg-gradient-blue" color="hsl(var(--chart-1))" className="lg:col-span-1"/>
                
                <div className="lg:col-span-2 hidden lg:block"></div> {/* Espacio vacío para empujar las tarjetas a 3 */}

                {/* Fila 2: Distribución y Mapa */}
                <div className="lg:col-span-2">
                    {deviceData && <DeviceDistributionChart browserData={deviceData.browserData} osData={deviceData.osData} />}
                </div>

                <div className="lg:col-span-3">
                    <Card id="access-map" className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapIcon className="h-5 w-5 text-primary"/>
                                Mapa de Accesos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-full min-h-[250px] flex flex-col items-center justify-center">
                            <AnimatedGlobe />
                            <h3 className="font-semibold text-lg text-foreground mt-4">Próximamente</h3>
                            <p className="text-sm text-muted-foreground">Visualización geográfica de inicios de sesión.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Card id="security-log-table">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Registro de Eventos Recientes
                            </CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Evento</TableHead>
                                <TableHead>Detalles</TableHead>
                                <TableHead>Usuario</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No hay registros para mostrar.</TableCell></TableRow>
                            ) : (
                                logs.slice(0, 5).map((log) => {
                                    const eventDetails = getEventDetails(log.event as SecurityLogEvent, log.details);
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                {eventDetails.icon}
                                                <span className="font-medium text-sm">{eventDetails.label}</span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{eventDetails.details}</TableCell>
                                            <TableCell>
                                                {log.user ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7"><AvatarImage src={log.user.avatar || undefined} /><AvatarFallback><Identicon userId={log.user.id} /></AvatarFallback></Avatar>
                                                        <span className="text-sm font-medium">{log.user.name}</span>
                                                    </div>
                                                ) : <div className="text-xs font-mono text-muted-foreground">{log.emailAttempt || 'Sistema'}</div>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                   <Button variant="outline" size="sm" asChild className="w-full">
                       <Link href="/security-audit/full-log">
                            Ver todos los eventos ({totalLogs}) <ArrowRight className="ml-2 h-4 w-4"/>
                       </Link>
                   </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
