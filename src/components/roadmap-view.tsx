// src/components/roadmap-view.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Code, Database, Paintbrush, Rocket, CheckCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const roadmapPhases = [
  {
    icon: Lightbulb,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    title: 'Fase 1: Concepción y Planificación Estratégica',
    description: 'Se identificó la necesidad y se definieron los roles de usuario y las características clave (MVP). Se crearon los documentos fundamentales que guiarían todo el desarrollo, asegurando una visión clara y alineada desde el principio.',
  },
  {
    icon: Database,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    title: 'Fase 2: Arquitectura y Backend',
    description: 'Se configuró el proyecto con Next.js, TypeScript y Supabase. Se modeló la base de datos con Prisma y se construyeron todos los API Endpoints para la lógica de negocio, incluyendo autenticación y gestión de datos.',
  },
  {
    icon: Paintbrush,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    title: 'Fase 3: Desarrollo de la Interfaz de Usuario (UI/UX)',
    description: 'Con el backend funcional, el enfoque se trasladó a la experiencia del usuario. Se construyó el layout principal, los componentes reutilizables y todas las páginas de la plataforma, conectándolas con la API.',
  },
  {
    icon: Rocket,
    color: 'text-fuchsia-500',
    bgColor: 'bg-fuchsia-500/10',
    title: 'Fase 4: Refinamiento y Despliegue',
    description: 'Se realizaron pruebas funcionales exhaustivas utilizando la matriz de trazabilidad, se hicieron ajustes finos a la interfaz y se optimizó el rendimiento general de la aplicación para su lanzamiento.',
  },
  {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    title: '¡Plataforma Lanzada y en Evolución!',
    description: 'NexusAlpri está en línea y en constante mejora, incorporando nuevas funcionalidades y mejoras basadas en el feedback para potenciar el aprendizaje continuo.',
  },
];

export const RoadmapView = () => {
    return (
        <div className="relative w-full max-w-4xl mx-auto">
            {/* La línea de tiempo vertical */}
            <div className="absolute left-6 md:left-1/2 top-0 h-full w-0.5 bg-border -translate-x-1/2" />

            <div className="space-y-12">
                {roadmapPhases.map((phase, index) => {
                    const Icon = phase.icon;
                    const isEven = index % 2 === 0;
                    return (
                        <div key={index} className="relative flex items-start gap-4 md:gap-8">
                             {/* Icono en la línea de tiempo */}
                            <div className={cn(
                                "absolute left-6 top-1 h-10 w-10 rounded-full flex items-center justify-center -translate-x-1/2",
                                phase.bgColor,
                                "md:static md:translate-x-0",
                                !isEven && "md:order-2"
                            )}>
                                <Icon className={cn("h-6 w-6", phase.color)} />
                            </div>

                             {/* Tarjeta de contenido */}
                            <div className={cn(
                                "w-full pl-10 md:pl-0",
                                isEven ? "md:w-1/2" : "md:w-1/2 md:pl-8 md:order-1"
                            )}>
                                <Card className={cn(
                                    "relative shadow-lg hover:shadow-2xl transition-shadow duration-300",
                                    !isEven && "md:text-right"
                                )}>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-headline">{phase.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground text-sm">{phase.description}</p>
                                    </CardContent>
                                     {/* Flecha decorativa */}
                                     <div className={cn(
                                        "hidden md:block absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-card border-t border-r transform rotate-45",
                                        isEven ? "-right-2 border-l-0 border-b-0" : "-left-2 border-r-0 border-t-0 -rotate-[135deg]"
                                    )}/>
                                </Card>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
