// src/app/(public)/page.tsx
'use client'; 

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers3, UserCog, Feather, ArrowRight, GraduationCap, Users, BookOpen, BarChart3 } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';

const features = [
  {
    icon: Layers3,
    title: 'Contenido Centralizado',
    description: 'Crea cursos con un editor visual, combinando videos, quizzes y documentos sin esfuerzo.',
  },
  {
    icon: BarChart3,
    title: 'Analíticas de Progreso',
    description: 'Obtén métricas claras sobre el avance de tus equipos para tomar decisiones basadas en datos.',
  },
  {
    icon: Users,
    title: 'Gestión de Usuarios',
    description: 'Define roles (Admin, Instructor, Estudiante) para administrar el acceso de forma segura y ordenada.',
  },
  {
    icon: Feather,
    title: 'Experiencia Fluida',
    description: 'Una interfaz rápida, intuitiva y optimizada para cualquier dispositivo, diseñada para aprender sin fricciones.',
  },
  {
    icon: BookOpen,
    title: 'Biblioteca de Recursos',
    description: 'Centraliza manuales, políticas y guías importantes en un único repositorio accesible para todos.',
  }
];

const benefits = [
  {
    icon: GraduationCap,
    title: 'Para Estudiantes',
    description: 'Aprende a tu ritmo, sigue tu progreso y obtén certificados.',
  },
  {
    icon: UserCog,
    title: 'Para Instructores',
    description: 'Crea contenido interactivo y analiza el rendimiento de tus alumnos.',
  },
  {
    icon: Users,
    title: 'Para Administradores',
    description: 'Control total sobre usuarios, contenido y la configuración de la plataforma.',
  },
];

export default function LandingPage() {
  const { settings } = useAuth();
  const landingImageUrl = settings?.landingImageUrl || "https://placehold.co/600x600/38bdf8/ffffff?text=NexusAlpri";
  const benefitsImageUrl = settings?.benefitsImageUrl || "https://placehold.co/600x400/38bdf8/ffffff?text=Beneficios";

  return (
      <div className="container flex-1 z-10 w-full text-slate-900">
        <section className="w-full">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    La Plataforma E-learning que Impulsa tu Talento Corporativo
                  </h1>
                  <p className="max-w-[600px] text-slate-900/70 md:text-xl">
                    Centraliza, gestiona y escala la formación de tus equipos con una herramienta potente, intuitiva y personalizable.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                    <Link href="/sign-up">
                      Empezar Ahora <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="bg-transparent border-slate-900/30 hover:bg-black/10 hover:text-slate-900">
                    <Link href="/about">
                      Saber más
                    </Link>
                  </Button>
                </div>
              </div>
               <div className="mx-auto aspect-square overflow-hidden rounded-xl w-full relative">
                <Image
                  src={landingImageUrl}
                  alt="Hero"
                  fill
                  className="object-cover"
                  data-ai-hint="team collaboration"
                  quality={100}
                  priority
                />
              </div>
            </div>
        </section>
        
        <section className="w-full bg-transparent py-12 md:py-16 mt-12 md:mt-16">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-white/20 text-slate-900/80 px-3 py-1 text-sm font-semibold border border-white/30">
                            Capacidades
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Una Solución Integral de Formación</h2>
                        <p className="max-w-[900px] text-slate-900/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Desde la creación de contenido interactivo hasta el análisis detallado del rendimiento, NexusAlpri te ofrece todo lo necesario para un ciclo de aprendizaje completo.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-8">
                   {features.map((feature) => {
                     const Icon = feature.icon;
                     return (
                     <div 
                        key={feature.title}
                        className="group relative rounded-2xl p-6 text-left h-full transition-all duration-300 overflow-hidden bg-background/20 backdrop-blur-sm shadow-lg hover:shadow-primary/20 hover:-translate-y-2 border border-white/30"
                      >
                       <div className="relative z-10 flex flex-col items-start justify-start h-full">
                         <div className="w-full h-12 mb-4 bg-black rounded-lg flex items-center justify-center">
                            <Icon className="w-8 h-8 text-white"/>
                         </div>
                         <h3 className="text-xl font-bold font-headline mb-2">{feature.title}</h3>
                         <p className="text-sm text-slate-900/80">{feature.description}</p>
                       </div>
                     </div>
                   )})}
                </div>
        </section>

        <section className="w-full py-12 md:py-16">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
                     <div className="mx-auto aspect-video overflow-hidden rounded-xl w-full relative shadow-lg">
                        <Image
                            src={benefitsImageUrl}
                            alt="Beneficios"
                            fill
                            className="object-cover"
                            data-ai-hint="diverse team working"
                            quality={100}
                        />
                     </div>
                    <div className="space-y-8">
                       {benefits.map((benefit) => {
                          const Icon = benefit.icon;
                          return (
                            <div key={benefit.title} className="flex items-start gap-4">
                              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-grow">
                                  <h3 className="text-xl font-bold">{benefit.title}</h3>
                                  <p className="text-slate-900/70">{benefit.description}</p>
                              </div>
                            </div>
                          )
                       })}
                    </div>
                </div>
        </section>
        
         <section className="w-full text-center py-12 md:py-16">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">¿Listo para Iniciar?</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-slate-900/70 md:text-xl">
                    Únete a las empresas que ya están revolucionando su forma de capacitar. Comienza gratis hoy mismo.
                 </p>
                  <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                    <Link href="/sign-up">
                      Crear Mi Cuenta
                    </Link>
                  </Button>
        </section>
      </div>
  );
}
