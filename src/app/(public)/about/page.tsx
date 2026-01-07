// src/app/(public)/about/page.tsx
'use client'; 

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Wind, Feather, Code, Type, Sparkles, Target, Rocket } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';

const techStack = [
  { name: 'Next.js', description: 'Para un rendimiento excepcional y una experiencia de usuario fluida gracias a su arquitectura híbrida de renderizado en servidor y cliente.', icon: Code, color: "from-blue-500 to-blue-600" },
  { name: 'TypeScript', description: 'Garantiza un código más seguro, mantenible y escalable, minimizando errores en producción y agilizando el desarrollo.', icon: Type, color: "from-blue-600 to-indigo-600" },
  { name: 'Prisma', description: 'Como ORM de nueva generación, simplifica y asegura las interacciones con la base de datos, proporcionando una capa de abstracción robusta.', icon: Database, color: "from-emerald-500 to-teal-600" },
  { name: 'Tailwind CSS', description: 'Nos permite construir interfaces complejas y personalizadas de forma rápida y consistente, siguiendo un sistema de diseño atómico.', icon: Wind, color: "from-cyan-500 to-blue-500" },
  { name: 'ShadCN UI', description: 'Para componentes de UI accesibles, reutilizables y estéticamente agradables, acelerando la construcción de una interfaz pulida.', icon: Feather, color: "from-pink-500 to-rose-500" },
];

const values = [
  { 
    icon: Target, 
    title: 'Enfoque en el Usuario', 
    description: 'Cada decisión de diseño y desarrollo se toma pensando en la experiencia del usuario final.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  { 
    icon: Sparkles, 
    title: 'Innovación Continua', 
    description: 'Adoptamos tecnologías emergentes para mantener la plataforma a la vanguardia del aprendizaje digital.',
    gradient: 'from-purple-500 to-pink-500'
  },
  { 
    icon: Rocket, 
    title: 'Excelencia Técnica', 
    description: 'Nos comprometemos con los más altos estándares de calidad, seguridad y rendimiento en cada línea de código.',
    gradient: 'from-orange-500 to-red-500'
  },
];

export default function AboutPage() {
  const { settings } = useAuth();
  const aboutImageUrl = settings?.aboutImageUrl || "https://placehold.co/600x400/38bdf8/ffffff?text=Nuestra+Misi%C3%B3n";

  return (
    <div className="relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-100 via-transparent to-transparent opacity-60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-60"></div>
      </div>

      <div className="container flex-1 z-10 w-full relative">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 mt-6 md:mt-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="mx-auto aspect-video overflow-hidden rounded-3xl w-full relative shadow-2xl order-first lg:order-last group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-3xl"></div>
              <Image
                src={aboutImageUrl}
                alt="Una ilustración de un cerebro del que florecen ideas y se convierten en un árbol de conocimiento, representando el desarrollo del talento."
                width={600}
                height={400}
                quality={100}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                data-ai-hint="visionary strategy whiteboard"
                priority
              />
            </div>
            
            <div className="space-y-6 text-left order-last lg:order-first">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2 text-sm font-bold shadow-lg">
                <Sparkles className="w-4 h-4" />
                Nuestra Visión
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-headline bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 bg-clip-text text-transparent leading-tight">
                Potenciar el Talento, Impulsar el Futuro
              </h1>
              
              <p className="max-w-[600px] text-slate-600 text-lg md:text-xl leading-relaxed">
                En NexusAlpri, creemos que el activo más valioso de cualquier organización es su gente. Nuestra misión es empoderar a cada colaborador con el conocimiento para innovar, la confianza para liderar y las habilidades para construir juntos el próximo capítulo de nuestro éxito.
              </p>

              {/* Values Cards */}
              <div className="grid gap-4 pt-4">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <div 
                      key={value.title}
                      className="flex items-start gap-4 p-5 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 group hover:-translate-y-1"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 mb-1 group-hover:text-purple-700 transition-colors">
                          {value.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="w-full bg-transparent py-12 md:py-20 mt-6 md:mt-8">
          <div className="mx-auto max-w-4xl text-center space-y-4 mb-12">
            <div className="inline-block rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-5 py-2 text-sm font-bold shadow-lg">
              Tecnología
            </div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Ingeniería para la Excelencia
            </h2>
            
            <p className="max-w-[900px] text-slate-600 text-lg md:text-xl leading-relaxed mx-auto">
              Hemos seleccionado un stack tecnológico de vanguardia, enfocado en ofrecer una experiencia de usuario que sea no solo funcional, sino también rápida, segura y un placer de usar. Cada tecnología fue elegida con un propósito claro: potenciar el aprendizaje.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech, index) => {
              const Icon = tech.icon;
              return (
                <div 
                  key={tech.name}
                  className="group relative rounded-3xl p-8 text-left h-full transition-all duration-500 overflow-hidden bg-white shadow-xl hover:shadow-2xl hover:-translate-y-3 border border-slate-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-br ${tech.color} opacity-5`}></div>
                  </div>
                  
                  {/* Decorative blur element */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${tech.color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`}></div>
                  
                  <div className="relative z-10 flex flex-col items-start justify-start h-full space-y-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <Icon className="w-8 h-8 text-white"/>
                    </div>
                    
                    <div className="flex-grow space-y-2">
                      <h3 className="text-2xl font-bold font-headline text-slate-900 group-hover:bg-gradient-to-r group-hover:from-purple-700 group-hover:to-blue-700 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                        {tech.name}
                      </h3>
                      <p className="text-base text-slate-600 leading-relaxed">
                        {tech.description}
                      </p>
                    </div>
                    
                    {/* Animated underline */}
                    <div className={`w-12 h-1 bg-gradient-to-r ${tech.color} rounded-full opacity-0 group-hover:opacity-100 group-hover:w-24 transition-all duration-500`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full py-12 md:py-16 mt-6 md:mt-8 mb-12">
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-12 md:p-16 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center max-w-3xl mx-auto space-y-4">
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                Construido con Pasión, Diseñado para el Éxito
              </h3>
              <p className="text-lg text-slate-300 leading-relaxed">
                Cada característica de NexusAlpri ha sido meticulosamente diseñada para crear una experiencia de aprendizaje que inspire, motive y transforme.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}