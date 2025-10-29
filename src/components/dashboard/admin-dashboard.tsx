// src/components/dashboard/admin-dashboard.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpenCheck, GraduationCap, Percent, PlusCircle, BarChart3, Settings, ShieldAlert, Monitor, Database } from "lucide-react";
import type { AdminDashboardStats, SecurityLog } from '@/types';
import { SecurityLogTimeline } from '../security/security-log-timeline';
import Link from "next/link";
import { InteractiveEventsWidget } from "./interactive-events-widget";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MetricCard } from "../analytics/metric-card";


const HealthStatusWidget = () => {
    const [healthStatus, setHealthStatus] = useState({ api: 'checking', db: 'checking' });

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const apiRes = await fetch('/api/health');
                const apiData = await apiRes.json();
                
                setHealthStatus({
                    api: apiRes.ok ? 'operational' : 'error',
                    db: apiData.db === 'connected' ? 'operational' : 'error',
                });
            } catch (error) {
                setHealthStatus({ api: 'error', db: 'error' });
            }
        };
        checkHealth();
    }, []);

    const StatusIndicator = ({ status }: { status: 'checking' | 'operational' | 'error' }) => (
        <div className="flex items-center gap-2 text-sm font-semibold">
            <div className={cn("h-2.5 w-2.5 rounded-full", {
                'bg-yellow-400 animate-pulse': status === 'checking',
                'bg-green-500': status === 'operational',
                'bg-red-500': status === 'error',
            })} />
            <span className={cn({
                'text-muted-foreground': status === 'checking',
                'text-green-600': status === 'operational',
                'text-destructive': status === 'error',
            })}>
                {status === 'checking' ? 'Verificando...' : (status === 'operational' ? 'Operacional' : 'Fallo')}
            </span>
        </div>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Salud de la Plataforma</CardTitle>
                <CardDescription>Estado de los servicios críticos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><Monitor className="h-4 w-4"/><span>API</span></div><StatusIndicator status={healthStatus.api as any} /></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm"><Database className="h-4 w-4"/><span>Base de Datos</span></div><StatusIndicator status={healthStatus.db as any} /></div>
            </CardContent>
        </Card>
    );
}

export function AdminDashboard({ adminStats, securityLogs, onParticipate }: {
  adminStats: AdminDashboardStats;
  securityLogs: SecurityLog[];
  onParticipate: (eventId: string, occurrenceDate: Date) => void;
}) {
  if (!adminStats) return null;

  return (
    <div className="space-y-8">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline">Centro de Mando</h1>
            <p className="text-muted-foreground">Una vista general y accionable del estado de tu plataforma.</p>
        </div>
        
        {/* Métricas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="admin-stats-cards">
            <MetricCard title="Usuarios Totales" value={adminStats.totalUsers} icon={Users} gradient="bg-gradient-blue" />
            <MetricCard title="Cursos Publicados" value={adminStats.totalPublishedCourses} icon={BookOpenCheck} gradient="bg-gradient-green" />
            <MetricCard title="Inscripciones Totales" value={adminStats.totalEnrollments} icon={GraduationCap} gradient="bg-gradient-purple" />
            <MetricCard title="Finalización Promedio" value={Math.round(adminStats.averageCompletionRate)} icon={Percent} unit="%" gradient="bg-gradient-pink" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Columna Izquierda: Auditoría y Salud */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Auditoría de Seguridad Activa</CardTitle>
                        <CardDescription>Últimos eventos importantes en la plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SecurityLogTimeline logs={securityLogs} onLogClick={() => {}} />
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" asChild size="sm">
                            <Link href="/security-audit">Ver auditoría completa</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Columna Derecha: Acciones y Estado */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                <HealthStatusWidget />
                <Card>
                    <CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Button variant="outline" asChild><Link href="/manage-courses"><PlusCircle className="mr-2 h-4 w-4"/>Crear Curso</Link></Button>
                        <Button variant="outline" asChild><Link href="/users"><Users className="mr-2 h-4 w-4"/>Gestionar Usuarios</Link></Button>
                        <Button variant="outline" asChild><Link href="/analytics"><BarChart3 className="mr-2 h-4 w-4"/>Ver Analíticas</Link></Button>
                        <Button variant="outline" asChild><Link href="/settings"><Settings className="mr-2 h-4 w-4"/>Ajustes</Link></Button>
                    </CardContent>
                </Card>
                 <InteractiveEventsWidget events={adminStats.interactiveEventsToday} onParticipate={onParticipate} />
            </div>
        </div>
    </div>
  );
}
