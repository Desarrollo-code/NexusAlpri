
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, BookOpenCheck, Activity, TrendingUp, ShieldCheck, UserCheck, Group, Award, FileWarning, Clock, Percent } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserAnalyticsData, UsersByRole, CourseAnalyticsData } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';


const MetricItem = ({ title, value, icon: Icon, unit = '' }: { title:string, value: string | number, icon: React.ElementType, unit?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}<span className="text-lg font-normal text-muted-foreground">{unit}</span></div>
        </CardContent>
    </Card>
);

const UserAnalyticsSection = () => {
    const [data, setData] = useState<UserAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analytics/users');
            if (!response.ok) throw new Error('Failed to fetch user analytics');
            const result: UserAnalyticsData = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserAnalytics();
    }, [fetchUserAnalytics]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <p>Error al cargar datos de usuarios.</p>
                <Button onClick={fetchUserAnalytics} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
        );
    }
    
    const roleColors: { [key in UsersByRole['role']]: string } = {
        ADMINISTRATOR: 'hsl(var(--chart-3))',
        INSTRUCTOR: 'hsl(var(--chart-2))',
        STUDENT: 'hsl(var(--chart-1))',
    };
    const pieChartData = data.usersByRole.map(roleData => ({
        name: roleData.role.charAt(0) + roleData.role.slice(1).toLowerCase(),
        value: roleData.count,
        fill: roleColors[roleData.role] || '#ccc'
    }));
    
    const totalUsers = data.usersByRole.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <MetricItem title="Total de Usuarios" value={totalUsers} icon={Users} />
                <MetricItem title="Usuarios Activos (7d)" value={data.activeUsersLast7Days} icon={UserCheck} />
                <Card>
                    <CardHeader><CardTitle className="text-base">Distribución por Rol</CardTitle></CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader><CardTitle className="text-base">Nuevos Registros (Últimos 30 días)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.newUsersLast30Days}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="hsl(var(--primary))" name="Nuevos Usuarios"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const CourseAnalyticsSection = () => {
    const [data, setData] = useState<CourseAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourseAnalytics = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analytics/courses');
            if (!response.ok) throw new Error('Failed to fetch course analytics');
            const result: CourseAnalyticsData = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourseAnalytics();
    }, [fetchCourseAnalytics]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <p>Error al cargar datos de cursos.</p>
                <Button onClick={fetchCourseAnalytics} variant="outline" size="sm" className="mt-2">Reintentar</Button>
            </div>
        );
    }

    const categoryColors = [
        'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 
        'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--chart-1))' // repeat colors if more than 5
    ];
    const categoryPieData = data.coursesByCategory.map((cat, index) => ({
        name: cat.category,
        value: cat.count,
        fill: categoryColors[index % categoryColors.length]
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <MetricItem title="Tasa de Finalización" value={data.averageCompletionRate.toFixed(1)} icon={Percent} unit="%"/>
                    <MetricItem title="Puntaje Promedio (Quizzes)" value={data.averageQuizScore.toFixed(1)} icon={Award} unit="%"/>
                </div>
                <Card>
                    <CardHeader><CardTitle className="text-base">Top 5 Cursos Más Populares</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.mostEnrolledCourses} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false}/>
                                <YAxis type="category" dataKey="title" width={120} tick={{ fontSize: 11 }} className="truncate" />
                                <Tooltip />
                                <Bar dataKey="enrollments" fill="hsl(var(--primary))" name="Inscripciones" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-base">Distribución por Categoría</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={345}>
                            <PieChart>
                                <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} label>
                                    {categoryPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


export default function AnalyticsPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
        }
    }, [currentUser, router]);

    if (currentUser?.role !== 'ADMINISTRATOR') {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline mb-2">Informes y Analíticas Avanzadas</h1>
                <p className="text-muted-foreground">Métricas clave para la toma de decisiones y el seguimiento del rendimiento de la plataforma.</p>
            </div>
            
            <Accordion type="multiple" defaultValue={['item-1']} className="w-full space-y-6">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><Users className="mr-3 h-5 w-5 text-primary" /> Analíticas de Usuarios</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <UserAnalyticsSection />
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><BookOpenCheck className="mr-3 h-5 w-5 text-primary" /> Analíticas de Cursos y Contenido</AccordionTrigger>
                    <AccordionContent className="pt-4">
                         <CourseAnalyticsSection />
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="item-3">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><TrendingUp className="mr-3 h-5 w-5 text-primary" /> Analíticas de Progreso de Estudiantes</AccordionTrigger>
                    <AccordionContent className="pt-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MetricItem title="Progreso Individual" value="N/A" icon={UserCheck}/>
                            <MetricItem title="Progreso Grupal" value="N/A" icon={Group}/>
                            <MetricItem title="Certificados Emitidos" value="N/A" icon={Award}/>
                             <MetricItem title="Tiempo Promedio Finalización" value="N/A" icon={Clock}/>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><Activity className="mr-3 h-5 w-5 text-primary" /> Analíticas de Interacción y Compromiso</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <MetricItem title="Descargas de Recursos" value="N/A" icon={TrendingUp}/>
                           <MetricItem title="Uso de Funcionalidades" value="N/A" icon={Activity}/>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><ShieldCheck className="mr-3 h-5 w-5 text-primary" /> Analíticas de Seguridad</AccordionTrigger>
                    <AccordionContent className="pt-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <MetricItem title="Intentos de Inicio de Sesión Fallidos" value="N/A" icon={TrendingUp}/>
                           <MetricItem title="Registro de Cambios de Permisos" value="N/A" icon={Activity}/>
                       </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
