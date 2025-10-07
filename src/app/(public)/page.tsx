// src/app/(public)/page.tsx
'use client'; 

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers3, BarChart3, Users, ShieldCheck, Zap, BookOpen, UserCheck, ArrowRight } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { GradientIcon } from '@/components/ui/gradient-icon';

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
    icon: ShieldCheck,
    title: 'Seguridad Corporativa',
    description: 'Implementa políticas de contraseña, 2FA y audita la actividad para proteger la información de tu empresa.',
  },
   {
    icon: Zap,
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
    icon: BookOpen,
    title: 'Para Estudiantes',
    description: 'Accede a tus cursos desde cualquier lugar, sigue tu progreso y obtén certificados al finalizar.',
  },
  {
    icon: UserCheck,
    title: 'Para Instructores',
    description: 'Crea y gestiona tu contenido con una interfaz drag-and-drop y analiza el rendimiento de tus alumnos.',
  },
  {
    icon: Users,
    title: 'Para Administradores',
    description: 'Supervisa toda la actividad, gestiona usuarios y personaliza la plataforma a la medida de tu empresa.',
  },
];

export default function LandingPage() {
  const { settings } = useAuth();
  const landingImageUrl = settings?.landingImageUrl || "https://placehold.co/600x600/38bdf8/ffffff?text=NexusAlpri";
  const benefitsImageUrl = settings?.benefitsImageUrl || "https://placehold.co/600x400/38bdf8/ffffff?text=Beneficios";

  const testimonials = [
    {
      name: 'Ana García',
      role: 'Líder de Capacitación, TechCorp',
      testimony: 'NexusAlpri transformó nuestra formación interna. La facilidad para crear contenido y el seguimiento automático nos ahorraron cientos de horas.',
      avatar: 'https://placehold.co/100x100/ffffff/333333?text=AG'
    },
    {
      name: 'Carlos Mendoza',
      role: 'Gerente de Ventas, InnovaSolutions',
      testimony: 'La capacidad de crear quizzes y ver las analíticas nos ha permitido identificar brechas de conocimiento en nuestro equipo de ventas y actuar sobre ellas.',
       avatar: 'https://placehold.co/100x100/ffffff/333333?text=CM'
    }
  ]

  return (
      <div className="flex-1 z-10 w-full text-foreground">
        <section className="w-full">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    La Plataforma E-learning que Impulsa tu Talento Corporativo
                  </h1>
                  <p className="max-w-[600px] text-foreground/80 md:text-xl">
                    Centraliza, gestiona y escala la formación de tus equipos con una herramienta potente, intuitiva y personalizable.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                    <Link href="/sign-up">
                      Empezar Ahora <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="bg-transparent border-foreground/30 hover:bg-background/20 hover:text-foreground">
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
          </div>
        </section>
        
        <section className="w-full bg-transparent py-12 md:py-16 mt-12 md:mt-16">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-background/20 text-foreground/80 px-3 py-1 text-sm font-semibold border border-border/30">
                            Capacidades
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Una Solución Integral de Formación</h2>
                        <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Desde la creación de contenido interactivo hasta el análisis detallado del rendimiento, NexusAlpri te ofrece todo lo necesario para un ciclo de aprendizaje completo.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-8">
                   {features.map((feature) => (
                     <div 
                        key={feature.title}
                        className="group relative rounded-2xl p-6 text-left h-full transition-all duration-300 overflow-hidden bg-background/20 backdrop-blur-sm shadow-lg hover:shadow-primary/20 hover:-translate-y-2 border border-border/30 before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:h-80 before:w-80 before:translate-x-[var(--x)] before:translate-y-[var(--y)] before:rounded-full before:bg-primary/50 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 hover:before:opacity-20"
                        onMouseMove={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
                            e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
                        }}
                      >
                       <div className="relative z-10 flex flex-col items-start justify-start h-full">
                         <div className="mb-4 bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-lg border border-border/30">
                            <GradientIcon icon={feature.icon} size="xl" />
                         </div>
                         <h3 className="text-xl font-bold font-headline mb-2">{feature.title}</h3>
                         <p className="text-sm text-foreground/70">{feature.description}</p>
                       </div>
                     </div>
                   ))}
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-16">
            <div className="container px-4 md:px-6">
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
                       {benefits.map((benefit, i) => (
                          <div key={benefit.title} className="flex items-start gap-4">
                            <GradientIcon icon={benefit.icon} size="xl" />
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold">{benefit.title}</h3>
                                <p className="text-foreground/70">{benefit.description}</p>
                            </div>
                          </div>
                       ))}
                    </div>
                </div>
            </div>
        </section>
        
        <section className="w-full bg-transparent py-12 md:py-16 mt-12">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-background/20 text-foreground/80 px-3 py-1 text-sm font-semibold border border-border/30">
                            Testimonios
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">La Voz de Nuestros Clientes</h2>
                    </div>
                </div>
                 <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 py-12">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.name} className="bg-background/20 border-border/30 text-foreground">
                           <CardContent className="pt-6">
                             <blockquote className="text-lg font-semibold leading-snug">
                               “{testimonial.testimony}”
                             </blockquote>
                           </CardContent>
                           <CardFooter>
                              <div className="flex items-center gap-3">
                                <Image className="rounded-full" src={testimonial.avatar} height={40} width={40} alt={testimonial.name} data-ai-hint="portrait person" quality={100} />
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-foreground/70">{testimonial.role}</p>
                                </div>
                              </div>
                           </CardFooter>
                        </Card>
                    ))}
                 </div>
            </div>
        </section>
        
         <section className="w-full text-center py-12 md:py-16">
            <div className="container px-4 md:px-6">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">¿Listo para Iniciar?</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-foreground/70 md:text-xl">
                    Únete a las empresas que ya están revolucionando su forma de capacitar. Comienza gratis hoy mismo.
                 </p>
                  <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                    <Link href="/sign-up">
                      Crear Mi Cuenta
                    </Link>
                  </Button>
            </div>
        </section>
      </div>
  );
}
