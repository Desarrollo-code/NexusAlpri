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
    <div className="relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-100 via-transparent to-transparent opacity-60"></div>
      </div>

      <div className="container flex-1 z-10 w-full relative">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 mt-6 md:mt-8">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col justify-center space-y-6 text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold shadow-lg w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Plataforma de Aprendizaje Empresarial
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl font-headline bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent leading-tight">
                  Tu Ecosistema de Crecimiento y Conocimiento
                </h1>
                <p className="max-w-[600px] text-slate-600 text-lg md:text-xl leading-relaxed">
                  Una plataforma integral diseñada para potenciar el talento, centralizar la formación y construir una cultura de aprendizaje continuo en tu organización.
                </p>
              </div>
              
              <div className="flex flex-col gap-3 min-[400px]:flex-row pt-2">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0">
                  <Link href="/sign-in" className="flex items-center gap-2">
                    Iniciar Sesión 
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform"/>
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg" className="bg-white/80 backdrop-blur-sm border-slate-300 hover:bg-white hover:border-slate-400 text-slate-900 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/about">
                    Nuestra Visión
                  </Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">100+</div>
                  <div className="text-xs text-slate-600">Cursos</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">50K+</div>
                  <div className="text-xs text-slate-600">Usuarios</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">95%</div>
                  <div className="text-xs text-slate-600">Satisfacción</div>
                </div>
              </div>
            </div>
            
            <div className="mx-auto aspect-square overflow-hidden rounded-3xl w-full relative shadow-2xl hover:shadow-3xl transition-shadow duration-500 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <Image
                src={landingImageUrl}
                alt="Una ilustración abstracta de nodos de conocimiento interconectados, simbolizando el crecimiento y la colaboración."
                width={600}
                height={600}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                data-ai-hint="abstract knowledge network"
                quality={100}
                priority
              />
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="w-full bg-transparent py-12 md:py-20 mt-6 md:mt-8">
          <div className="mx-auto max-w-4xl text-center space-y-4">
            <div className="inline-block rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-2 text-sm font-bold shadow-lg">
              Capacidades
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Una Solución de Formación Integral
            </h2>
            <p className="max-w-[900px] text-slate-600 text-lg md:text-xl leading-relaxed mx-auto">
              NexusAlpri ha sido diseñado para unificar y potenciar nuestro ciclo de aprendizaje. Desde la creación de contenido interactivo hasta el análisis detallado del rendimiento, te ofrecemos las herramientas para crecer.
            </p>
          </div>
          
          <div className="mx-auto grid max-w-6xl items-stretch gap-6 py-12 lg:grid-cols-3 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="group relative rounded-3xl p-8 text-left h-full transition-all duration-500 overflow-hidden bg-white shadow-xl hover:shadow-2xl hover:-translate-y-3 border border-slate-200"
                  style={{
                    animationDelay: `${index * 150}ms`
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="relative z-10 flex flex-col items-start justify-start h-full space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Icon />
                    </div>
                    <h3 className="text-2xl font-bold font-headline text-slate-900 group-hover:text-blue-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-base text-slate-600 leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:w-24 transition-all duration-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-12 md:py-20 mt-6 md:mt-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="mx-auto aspect-video overflow-hidden rounded-3xl w-full relative shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <Image
                src={benefitsImageUrl}
                alt="Un equipo diverso teniendo un 'momento eureka' frente a un tablero, celebrando una solución."
                width={600}
                height={400}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                data-ai-hint="team eureka moment"
                quality={100}
              />
            </div>
            
            <div className="space-y-6 text-left">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={benefit.title} 
                    className="flex items-start gap-5 p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-x-2 group border border-slate-200"
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full text-center py-16 md:py-24 mt-6 md:mt-8 mb-12">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 md:p-16 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline text-white">
                Tu Viaje de Desarrollo Comienza Aquí
              </h2>
              <p className="max-w-2xl mt-4 text-blue-50 text-lg md:text-xl mx-auto leading-relaxed">
                Inicia sesión para acceder a tu ruta de aprendizaje personalizada y contribuir al crecimiento colectivo de nuestra organización.
              </p>
              <Button asChild size="lg" className="mt-8 bg-white text-blue-700 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-lg px-8 py-6">
                <Link href="/sign-in" className="flex items-center gap-2">
                  Acceder a la Plataforma
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}