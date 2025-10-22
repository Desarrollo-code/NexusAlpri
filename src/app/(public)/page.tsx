
// src/app/(public)/page.tsx
'use client'; 

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers3, ArrowUp, UserCog, Feather, ArrowRight, GraduationCap, Users, BookOpen, BarChart3 } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';

const features = [
  {
    icon: (props: any) => (
      <Layers3 {...props} className="w-8 h-8 text-white" />
    ),
    title: 'Cultura tu Conocimiento',
    description: 'Crea y comparte cursos dinámicos, combinando videos, quizzes interactivos y documentos esenciales en una única plataforma centralizada.',
  },
  {
    icon: (props: any) => (
      <ArrowUp {...props} className="w-8 h-8 text-white" strokeWidth={3}/>
    ),
    title: 'Impulsa el Crecimiento',
    description: 'Visualiza el progreso del equipo en tiempo real, identifica oportunidades de mejora y toma decisiones basadas en datos para potenciar el talento.',
  },
  {
    icon: (props: any) => (
      <Users {...props} className="w-8 h-8 text-white" />
    ),
    title: 'Fomenta la Colaboración',
    description: 'Construye una comunidad de aprendizaje activa a través de foros de discusión, mensajería directa y actividades grupales dinámicas.',
  },
];

const benefits = [
  {
    icon: GraduationCap,
    title: 'Para Colaboradores',
    description: 'Desarrolla tus habilidades a tu propio ritmo, sigue tu progreso y obtén reconocimiento con certificados de finalización.',
  },
  {
    icon: UserCog,
    title: 'Para Líderes y Formadores',
    description: 'Diseña contenido interactivo, imparte conocimiento y analiza el impacto de la formación en tu equipo.',
  },
  {
    icon: Users,
    title: 'Para Administradores',
    description: 'Control total sobre el ecosistema de aprendizaje: gestiona usuarios, contenido y la configuración global de la plataforma.',
  },
];

export default function LandingPage() {
  const { settings } = useAuth();
  const landingImageUrl = settings?.landingImageUrl || "https://placehold.co/600x600/38bdf8/ffffff?text=NexusAlpri";
  const benefitsImageUrl = settings?.benefitsImageUrl || "https://placehold.co/600x400/38bdf8/ffffff?text=Beneficios";

  return (
      <div className="container flex-1 z-10 w-full">
        <section className="w-full py-6 md:py-8 mt-6 md:mt-8">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4 text-left">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-slate-900">
                    Nuestro Ecosistema de Crecimiento
                  </h1>
                  <p className="max-w-[600px] text-slate-900/70 md:text-xl">
                    Una ilustración abstracta de nodos de conocimiento interconectados, simbolizando el crecimiento y la colaboración.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                    <Link href="/sign-in">
                      Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="bg-transparent border-slate-900/30 hover:bg-black/10 hover:text-slate-900">
                    <Link href="/about">
                      Nuestra Visión
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
                  data-ai-hint="abstract knowledge network"
                  quality={100}
                  priority
                />
              </div>
            </div>
        </section>
        
        <section className="w-full bg-transparent py-6 md:py-8 mt-6 md:mt-8">
                 <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-block rounded-lg bg-emerald-100 text-emerald-800 px-3 py-1 text-sm font-semibold border border-emerald-200 backdrop-blur-sm">
                        Capacidades
                    </div>
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-slate-900 mt-2">Una Solución de Formación Integral</h2>
                    <p className="max-w-[900px] text-slate-900/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4 mx-auto">
                        NexusAlpri ha sido diseñado para unificar y potenciar nuestro ciclo de aprendizaje. Desde la creación de contenido interactivo hasta el análisis detallado del rendimiento, te ofrecemos las herramientas para crecer.
                    </p>
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
                         <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center">
                            <Icon />
                         </div>
                         <h3 className="text-xl font-bold font-headline mt-4 text-slate-900">{feature.title}</h3>
                         <p className="text-sm text-slate-900/80 mt-2">{feature.description}</p>
                       </div>
                     </div>
                   )})}
                </div>
        </section>

        <section className="w-full py-6 md:py-8 mt-6 md:mt-8">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
                     <div className="mx-auto aspect-video overflow-hidden rounded-xl w-full relative shadow-lg">
                        <Image
                            src={benefitsImageUrl}
                            alt="Beneficios"
                            fill
                            className="object-cover"
                            data-ai-hint="Un equipo diverso teniendo un 'momento eureka' frente a un tablero, celebrando una solución."
                            quality={100}
                        />
                     </div>
                    <div className="space-y-8 text-left">
                       {benefits.map((benefit) => {
                          const Icon = benefit.icon;
                          return (
                            <div key={benefit.title} className="flex items-start gap-4">
                              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-accent text-accent-foreground">
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-grow">
                                  <h3 className="text-xl font-bold text-slate-900">{benefit.title}</h3>
                                  <p className="text-slate-900/70">{benefit.description}</p>
                              </div>
                            </div>
                          )
                       })}
                    </div>
                </div>
        </section>
        
         <section className="w-full text-center py-6 md:py-8 mt-6 md:mt-8">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-slate-900">Tu Viaje de Desarrollo Comienza Aquí</h2>
                 <p className="max-w-2xl mt-4 text-slate-900/70 md:text-xl mx-auto">
                    Inicia sesión para acceder a tu ruta de aprendizaje personalizada y contribuir al crecimiento colectivo de nuestra organización.
                 </p>
                  <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                    <Link href="/sign-in">
                      Acceder a la Plataforma
                    </Link>
                  </Button>
        </section>
      </div>
  );
}
