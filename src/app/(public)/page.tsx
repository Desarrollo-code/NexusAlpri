// src/app/(public)/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers3, BarChart3, Users, ShieldCheck, Zap, Heart, BookOpen, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import prisma from '@/lib/prisma';
import type { PlatformSettings } from '@/types';
import { GradientIcon } from '@/components/ui/gradient-icon';

export const dynamic = 'force-dynamic';

const features = [
  {
    icon: Layers3,
    title: 'Gestión de Contenido Intuitiva',
    description: 'Crea y organiza cursos con un editor de arrastrar y soltar, sin complicaciones técnicas.',
  },
  {
    icon: BarChart3,
    title: 'Seguimiento y Analíticas',
    description: 'Mide el progreso y el rendimiento con dashboards detallados para tomar decisiones informadas.',
  },
  {
    icon: Users,
    title: 'Roles y Permisos Granulares',
    description: 'Un sistema robusto (Admin, Instructor, Estudiante) para administrar el acceso de forma segura.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad Corporativa',
    description: 'Políticas de seguridad, auditorías y control total sobre los datos de tu organización.',
  },
   {
    icon: Zap,
    title: 'Experiencia de Usuario Moderna',
    description: 'Una interfaz rápida, intuitiva y optimizada para cualquier dispositivo, centrada en el aprendizaje.',
  },
  {
    icon: Heart,
    title: 'Gamificación Integrada',
    description: 'Involucra a tus equipos con puntos de experiencia y logros para aumentar la motivación.',
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

async function getPageSettings(): Promise<Partial<PlatformSettings>> {
    try {
        const settings = await prisma.platformSettings.findFirst({
            select: {
                platformName: true,
                landingImageUrl: true,
                benefitsImageUrl: true
            }
        });
        return {
            platformName: settings?.platformName || "NexusAlpri",
            landingImageUrl: settings?.landingImageUrl || "https://placehold.co/600x600.png",
            benefitsImageUrl: settings?.benefitsImageUrl || "https://placehold.co/600x400.png"
        };
    } catch (error) {
        console.error("Failed to fetch settings for Landing page, using defaults:", error);
        return {
            platformName: "NexusAlpri",
            landingImageUrl: "https://placehold.co/600x600.png",
            benefitsImageUrl: "https://placehold.co/600x400.png"
        };
    }
}


export default async function LandingPage() {
  const settings = await getPageSettings();
  const landingImageUrl = settings?.landingImageUrl;
  const benefitsImageUrl = settings?.benefitsImageUrl;

  const testimonials = [
    {
      name: 'Ana García',
      role: 'Líder de Capacitación, TechCorp',
      testimony: 'NexusAlpri transformó nuestra formación interna. La facilidad para crear contenido y el seguimiento automático nos ahorraron cientos de horas.',
      avatar: 'https://placehold.co/100x100.png?text=AG'
    },
    {
      name: 'Carlos Mendoza',
      role: 'Gerente de Ventas, InnovaSolutions',
      testimony: 'La capacidad de crear quizzes y ver las analíticas nos ha permitido identificar brechas de conocimiento en nuestro equipo de ventas y actuar sobre ellas.',
       avatar: 'https://placehold.co/100x100.png?text=CM'
    }
  ]

  return (
      <div className="flex-1 z-10 text-slate-800 space-y-8 md:space-y-10 w-full">
        <section className="w-full">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-white">
                    Despierta el Potencial.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-pink-400">Transforma tu Equipo.</span>
                  </h1>
                  <p className="max-w-[600px] text-slate-300 md:text-xl">
                    NexusAlpri es la plataforma de e-learning corporativa que se adapta a ti. Intuitiva, potente y segura.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="bg-white text-blue-600 font-bold hover:bg-slate-200 transition-transform hover:scale-105 shadow-lg">
                    <Link
                      href="/sign-up"
                    >
                      Empezar Ahora
                    </Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" className="bg-transparent text-white border-white/50 hover:bg-white/10 hover:text-white">
                    <Link
                      href="/about"
                    >
                      Saber más
                    </Link>
                  </Button>
                </div>
              </div>
               <div className="mx-auto aspect-square overflow-hidden rounded-xl w-full relative bg-white/10">
                <Image
                  src={landingImageUrl!}
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
        
        <section className="w-full bg-slate-900/40 backdrop-blur-sm py-8 md:py-12 border-y border-white/10">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-accent/20 text-accent px-3 py-1 text-sm font-semibold">
                            Características Principales
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-white">Una Plataforma Todo en Uno</h2>
                        <p className="max-w-[900px] text-slate-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Desde la creación de contenido hasta el análisis de resultados, todo lo que necesitas para potenciar el talento de tu equipo está aquí.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-8">
                   {features.map((feature) => (
                     <div 
                        key={feature.title}
                        className="relative rounded-2xl p-6 text-left h-full transition-all duration-300 overflow-hidden bg-slate-900/60 shadow-lg hover:shadow-primary/20 hover:-translate-y-2 border border-white/10 card-border-animated"
                      >
                       <div className="relative z-10 flex flex-col items-start justify-start h-full">
                         <div className="mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3 rounded-lg border border-white/10">
                            <GradientIcon icon={feature.icon} size="xl" />
                         </div>
                         <h3 className="text-xl font-bold font-headline mb-2 text-white">{feature.title}</h3>
                         <p className="text-sm text-slate-400">{feature.description}</p>
                       </div>
                     </div>
                   ))}
                </div>
            </div>
        </section>

        <section className="w-full py-8 md:py-12">
            <div className="container px-4 md:px-6">
                <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
                     <div className="mx-auto aspect-video overflow-hidden rounded-xl w-full relative shadow-2xl bg-white/10">
                        <Image
                            src={benefitsImageUrl!}
                            alt="Benefits"
                            fill
                            className="object-cover"
                            data-ai-hint="diverse team"
                            quality={100}
                        />
                     </div>
                    <div className="space-y-8">
                       {benefits.map((benefit, i) => (
                          <div key={benefit.title} className="flex items-start gap-4">
                            <GradientIcon icon={benefit.icon} size="xl" className={i === 1 ? "text-accent" : "text-primary"}/>
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-white">{benefit.title}</h3>
                                <p className="text-slate-300">{benefit.description}</p>
                            </div>
                          </div>
                       ))}
                    </div>
                </div>
            </div>
        </section>
        
        <section className="w-full bg-slate-900/40 backdrop-blur-sm py-8 md:py-12 border-y border-white/10">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-accent/20 text-accent px-3 py-1 text-sm font-semibold">
                            Testimonios
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-white">Lo que Nuestros Clientes Dicen</h2>
                    </div>
                </div>
                 <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 py-12">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.name} className="bg-slate-900/60 text-white border-white/10 shadow-lg">
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
                                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                                </div>
                              </div>
                           </CardFooter>
                        </Card>
                    ))}
                 </div>
            </div>
        </section>
        
         <section className="w-full text-center py-8">
            <div className="container px-4 md:px-6">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-white">¿Listo para Empezar?</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-slate-300 md:text-xl">
                    Únete a las empresas que ya están revolucionando su forma de capacitar.
                 </p>
                  <Button asChild size="lg" className="mt-8 bg-white text-blue-600 font-bold hover:bg-slate-200 transition-transform hover:scale-105 shadow-lg shadow-white/10">
                    <Link href="/sign-up">
                      Crear Mi Cuenta Gratis
                    </Link>
                  </Button>
            </div>
        </section>
      </div>
  );
}
