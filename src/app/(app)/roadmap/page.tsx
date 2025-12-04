// src/app/(app)/roadmap/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PhaseSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold font-headline text-primary border-b-2 border-primary/20 pb-2">{title}</h2>
        <div className="space-y-6">{children}</div>
    </div>
);

const Milestone = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
            {children}
        </ul>
    </div>
);

export default function RoadmapPage() {
  const { setPageTitle } = useTitle();

  useEffect(() => {
    setPageTitle('Ruta del Proyecto');
  }, [setPageTitle]);

  return (
    <div className="container max-w-5xl mx-auto py-8">
        <header className="text-center mb-12">
            <Rocket className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline">La Evolución de NexusAlpri</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                Un recorrido detallado por las fases de desarrollo que han dado forma a nuestra plataforma, desde su concepción hasta su estado actual.
            </p>
        </header>

        <div className="space-y-12">
            <PhaseSection title="Fase 1: Concepción y Planificación Estratégica">
                <Milestone title="Definición del Problema y Roles">
                    <li>Identificación de la necesidad de una plataforma de e-learning corporativa robusta y segura.</li>
                    <li>Definición de los tres perfiles clave: **Administrador**, **Instructor** y **Estudiante**.</li>
                    <li>Listado de características para el **Producto Mínimo Viable (MVP)**: gestión de usuarios, creación de cursos y biblioteca de recursos.</li>
                </Milestone>
            </PhaseSection>

            <Separator />

            <PhaseSection title="Fase 2: Arquitectura y Desarrollo del Núcleo">
                 <Milestone title="Inicialización y Backend">
                    <li>Creación del proyecto con **Next.js** y **TypeScript**.</li>
                    <li>Implementación del `schema.prisma` para la base de datos.</li>
                    <li>Desarrollo de los endpoints de la API para las **operaciones CRUD** básicas (usuarios, cursos, autenticación).</li>
                 </Milestone>
                 <Milestone title="Interfaz Base">
                    <li>Construcción del layout principal, incluyendo la barra lateral y las páginas de gestión iniciales.</li>
                 </Milestone>
            </PhaseSection>

            <Separator />

            <PhaseSection title="Fase 3: Transformación y Funcionalidades Avanzadas">
                <Milestone title="Gamificación y Reconocimiento">
                    <li>Implementación de **certificados con plantillas personalizables**.</li>
                    <li>Creación de **mensajes de motivación automáticos** para hitos.</li>
                    <li>Desarrollo de "Pausas Activas" interactivas para ganar XP.</li>
                </Milestone>
                 <Milestone title="Interactividad y Colaboración">
                    <li>Desarrollo del modo de juego **Quizz-IT** en tiempo real.</li>
                    <li>Habilitación de una sección de **comentarios** en los cursos.</li>
                </Milestone>
            </PhaseSection>
            
            <Separator />

            <PhaseSection title="Fase 4: Consolidación y Madurez">
                 <Milestone title="Experiencia de Usuario y Personalización">
                    <li>Rediseño del **Dashboard** principal con vistas personalizadas para cada rol.</li>
                    <li>Transformación de la página de usuarios en un **Control Central** para gestionar colaboradores y estructura organizacional.</li>
                    <li>Introducción de una paleta de **temas de color** para la interfaz.</li>
                    <li>Creación de una **Hoja de Ruta Interactiva** para visualizar la evolución del proyecto.</li>
                </Milestone>
            </PhaseSection>
        </div>
    </div>
  );
}
