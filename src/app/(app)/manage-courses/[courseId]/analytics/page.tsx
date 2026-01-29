'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, TrendingUp, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AnalyticsPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/manage-courses">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analíticas del Curso</h1>
                    <p className="text-muted-foreground">Métricas clave y rendimiento del contenido.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Inscritos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">
                            +0% desde el mes pasado
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tasa de Finalización
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--%</div>
                        <p className="text-xs text-muted-foreground">
                            Promedio del curso
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tiempo Promedio
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--h</div>
                        <p className="text-xs text-muted-foreground">
                            Para completar el curso
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Rendimiento General</CardTitle>
                    <CardDescription>Visualización detallada de las métricas estará disponible pronto.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <BarChart3 className="h-10 w-10 opacity-50" />
                            <p>Gráficas en desarrollo</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
