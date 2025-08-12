// src/app/(public)/page.tsx
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Users, BarChart, BookOpen, UserCheck, ShieldCheck, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'Aprendizaje Interactivo',
    description: 'Crea cursos con videos, textos y quizzes dinámicos para mantener a tus equipos enganchados.',
    gradient: 'from-primary/70 to-accent/70',
  },
  {
    icon: <BarChart className="h-8 w-8" />,
    title: 'Seguimiento Automatizado',
    description: 'El progreso se registra automáticamente, permitiéndote enfocarte en el contenido y no en el papeleo.',
    gradient: 'from-accent/70 to-primary/70',
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: 'Seguridad y Roles',
    description: 'Gestiona permisos detallados por rol (Estudiante, Instructor, Admin) y protege tu contenido.',
    gradient: 'from-primary/70 via-accent/70 to-primary/70',
  },
];

const benefits = [
  {
    icon: <BookOpen className="h-10 w-10 text-primary" />,
    title: 'Para Estudiantes',
    description: 'Accede a tus cursos desde cualquier lugar, sigue tu progreso y obtén certificados al finalizar.',
  },
  {
    icon: <UserCheck className="h-10 w-10 text-accent" />,
    title: 'Para Instructores',
    description: 'Crea y gestiona tu contenido con una interfaz drag-and-drop y analiza el rendimiento de tus alumnos.',
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: 'Para Administradores',
    description: 'Supervisa toda la actividad, gestiona usuarios y personaliza la plataforma a la medida de tu empresa.',
  },
];

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

export default function LandingPage() {
  return (
      <div className="flex-1 text-white">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Despierta el Potencial.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Transforma tu Equipo.</span>
                  </h1>
                  <p className="max-w-[600px] text-gray-200 md:text-xl">
                    NexusAlpri es la plataforma de e-learning corporativa que se adapta a ti. Intuitiva, potente y segura.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" variant="primary-gradient">
                    <Link
                      href="/sign-up"
                    >
                      Empezar Ahora
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild size="lg">
                    <Link
                      href="/about"
                    >
                      Saber más
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="/uploads/images/imagen 600x600.png"
                width="600"
                height="600"
                alt="Hero"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full"
                data-ai-hint="team collaboration"
                priority
              />
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 bg-black/20 backdrop-blur-lg relative z-10">
            <div className="container px-4 md:px-6">
                 <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-primary/20 px-3 py-1 text-sm text-primary-foreground font-semibold">
                            Características Principales
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Una Plataforma Todo en Uno</h2>
                        <p className="max-w-[900px] text-gray-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Desde la creación de contenido hasta el análisis de resultados, todo lo que necesitas está aquí.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-8">
                   {features.map((feature, index) => (
                     <div 
                        key={index}
                        className={cn(
                          "relative rounded-2xl p-8 text-center h-full transition-all duration-300 overflow-hidden",
                          "bg-white/5 text-white shadow-lg hover:shadow-xl",
                          "bg-gradient-to-br",
                          feature.gradient
                        )}
                      >
                       <div className="absolute inset-0 bg-black/10"></div>
                       <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                         <div className="mb-4 text-white/80">
                            {feature.icon}
                         </div>
                         <h3 className="text-2xl font-bold font-headline mb-2">{feature.title}</h3>
                         <p className="text-white/70">{feature.description}</p>
                       </div>
                     </div>
                   ))}
                </div>
            </div>
        </section>

        <section className="w-full py-12 md:py-24 relative z-10">
            <div className="container px-4 md:px-6">
                <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
                        <Image
                        src="/uploads/images/imagen 600x400.png"
                        width="600"
                        height="400"
                        alt="Benefits"
                        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full shadow-2xl"
                        data-ai-hint="diverse team"
                      />
                    <div className="space-y-8">
                       {benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0">{benefit.icon}</div>
                            <div>
                                <h3 className="text-xl font-bold">{benefit.title}</h3>
                                <p className="text-gray-300">{benefit.description}</p>
                            </div>
                          </div>
                       ))}
                    </div>
                </div>
            </div>
        </section>
        
        <section className="w-full py-12 md:py-24 bg-black/20 backdrop-blur-lg relative z-10">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <div className="inline-block rounded-lg bg-primary/20 px-3 py-1 text-sm text-primary-foreground font-semibold">
                            Testimonios
                        </div>
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Lo que Nuestros Clientes Dicen</h2>
                    </div>
                </div>
                 <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 py-12">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="bg-white/10 backdrop-blur-sm card-border-animated border-white/20 text-white">
                           <CardContent className="pt-6">
                             <blockquote className="text-lg font-semibold leading-snug">
                               “{testimonial.testimony}”
                             </blockquote>
                           </CardContent>
                           <CardFooter>
                              <div className="flex items-center gap-3">
                                <Image className="rounded-full" src={testimonial.avatar} height={40} width={40} alt={testimonial.name} data-ai-hint="portrait person" />
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-gray-300">{testimonial.role}</p>
                                </div>
                              </div>
                           </CardFooter>
                        </Card>
                    ))}
                 </div>
            </div>
        </section>
        
         <section className="w-full py-20 md:py-32 text-center bg-black/20 backdrop-blur-lg relative z-10">
            <div className="container px-4 md:px-6">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">¿Listo para Empezar?</h2>
                 <p className="max-w-2xl mx-auto mt-4 text-gray-200 md:text-xl">
                    Únete a las empresas que ya están revolucionando su forma de capacitar.
                 </p>
                  <Button asChild size="lg" variant="primary-gradient" className="mt-8">
                    <Link href="/sign-up">
                      Crear Mi Cuenta Gratis
                    </Link>
                  </Button>
            </div>
        </section>
      </div>
  );
}
