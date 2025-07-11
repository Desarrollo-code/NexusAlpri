
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, BookOpenCheck, Activity, BarChart3, ShieldCheck, TrendingUp, UserCheck, Percent, Clock, FileWarning, Group, Award, MessageSquare, Download, Calendar, KeyRound } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';


const AnalyticsCategoryCard = ({ title, description, icon: Icon, children }: { title: string; description: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Card className="w-full">
        <CardHeader>
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                   <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {children}
            </div>
        </CardContent>
    </Card>
);

const MetricItem = ({ title, children }: { title: string; children: React.ReactNode; }) => (
    <div className="p-3 border rounded-md bg-muted/30">
        <h4 className="font-semibold text-sm">{title}</h4>
        <div className="text-sm text-muted-foreground mt-1 space-y-1">
            {children}
        </div>
    </div>
);


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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <MetricItem title="Usuarios Activos vs. Inactivos">
                                <p>• Actividad basada en inicio de sesión en los últimos 7/30 días.</p>
                                <p>• Gráfico de tendencia de actividad a lo largo del tiempo.</p>
                           </MetricItem>
                           <MetricItem title="Nuevos Registros">
                                <p>• Visualización de nuevos usuarios por día, semana o mes.</p>
                                <p>• Identificación de picos y valles en los registros.</p>
                           </MetricItem>
                            <MetricItem title="Distribución de Roles">
                                <p>• Gráfico circular o de barras mostrando la proporción de Estudiantes, Instructores y Administradores.</p>
                           </MetricItem>
                           <MetricItem title="Tiempo Promedio en Plataforma">
                                <p>• Medición del tiempo promedio por sesión para evaluar el engagement.</p>
                           </MetricItem>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><BookOpenCheck className="mr-3 h-5 w-5 text-primary" /> Analíticas de Cursos y Contenido</AccordionTrigger>
                    <AccordionContent className="pt-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MetricItem title="Popularidad de Cursos">
                                <p>• Top 5 cursos con más inscripciones.</p>
                                <p>• Top 5 cursos con la tasa más alta de finalización.</p>
                            </MetricItem>
                             <MetricItem title="Tasas de Finalización">
                                <p>• Comparativa de tasas de finalización entre diferentes cursos.</p>
                                <p>• Tiempo promedio que toma completar un curso.</p>
                            </MetricItem>
                             <MetricItem title="Rendimiento en Evaluaciones">
                                <p>• Puntuaciones promedio por curso y por lección.</p>
                                <p>• Identificación de las preguntas más falladas para mejorar contenido.</p>
                            </MetricItem>
                             <MetricItem title="Contenido No Consumido">
                                <p>• Listado de cursos o lecciones con pocas o ninguna visualización.</p>
                            </MetricItem>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="item-3">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><TrendingUp className="mr-3 h-5 w-5 text-primary" /> Analíticas de Progreso de Estudiantes</AccordionTrigger>
                    <AccordionContent className="pt-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <MetricItem title="Progreso Individual">
                                <p>• Ficha de estudiante con cursos en progreso, pendientes y finalizados.</p>
                                <p>• Puntuaciones promedio en todas sus evaluaciones.</p>
                                <p>• Opción para descargar reporte en PDF.</p>
                            </MetricItem>
                             <MetricItem title="Progreso Grupal">
                                <p>• (Futuro) Progreso consolidado por departamento o grupo.</p>
                                <p>• (Futuro) Comparativas de avance entre diferentes equipos.</p>
                            </MetricItem>
                              <MetricItem title="Certificados Emitidos">
                                <p>• Número total de certificados otorgados por la finalización de cursos.</p>
                            </MetricItem>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><Activity className="mr-3 h-5 w-5 text-primary" /> Analíticas de Interacción y Compromiso</AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <MetricItem title="Descargas de Recursos">
                                <p>• Ranking de los archivos más descargados de la biblioteca.</p>
                           </MetricItem>
                           <MetricItem title="Uso de Funcionalidades">
                                <p>• Frecuencia de uso del calendario, anuncios, etc.</p>
                           </MetricItem>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                    <AccordionTrigger className="text-xl font-semibold bg-muted/50 p-4 rounded-lg hover:no-underline"><ShieldCheck className="mr-3 h-5 w-5 text-primary" /> Analíticas de Seguridad</AccordionTrigger>
                    <AccordionContent className="pt-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <MetricItem title="Intentos de Inicio de Sesión Fallidos">
                                <p>• Gráfico de tendencia para identificar picos de intentos fallidos.</p>
                                <p>• Distribución por usuario y por dirección IP.</p>
                           </MetricItem>
                           <MetricItem title="Registro de Cambios de Permisos">
                                <p>• Auditoría de quién cambió qué rol y cuándo.</p>
                           </MetricItem>
                       </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
