// src/app/(public)/about/page.tsx
'use client'; 

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Wind, Feather, Code, Type } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function AboutPage() {
  const { settings } = useAuth();
  const aboutImageUrl = settings?.aboutImageUrl || "https://placehold.co/600x400/38bdf8/ffffff?text=Nuestra+Misi%C3%B3n";

  const techStack = [
    { name: 'Next.js', description: 'Para un rendimiento excepcional y una experiencia de usuario fluida gracias a su arquitectura híbrida de renderizado en servidor y cliente.', icon: Code, color: "text-blue-500" },
    { name: 'TypeScript', description: 'Garantiza un código más seguro, mantenible y escalable, minimizando errores en producción y agilizando el desarrollo.', icon: Type, color: "text-blue-500" },
    { name: 'Prisma', description: 'Como ORM de nueva generación, simplifica y asegura las interacciones con la base de datos, proporcionando una capa de abstracción robusta.', icon: Database, color: "text-emerald-500" },
    { name: 'Tailwind CSS', description: 'Nos permite construir interfaces complejas y personalizadas de forma rápida y consistente, siguiendo un sistema de diseño atómico.', icon: Wind, color: "text-cyan-500" },
    { name: 'ShadCN UI', description: 'Para componentes de UI accesibles, reutilizables y estéticamente agradables, acelerando la construcción de una interfaz pulida.', icon: Feather, color: "text-pink-500" },
  ];

  return (
    <div className="container flex-1 z-10 w-full">
        <section className="w-full py-6 md:py-8 mt-6 md:mt-8">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
               <div className="mx-auto aspect-video overflow-hidden rounded-xl w-full relative shadow-lg order-first lg:order-last">
                <Image
                  src={aboutImageUrl}
                  alt="Nuestra Misión"
                  fill
                  quality={100}
                  className="object-cover"
                  data-ai-hint="team brainstorming"
                />
              </div>
              <div className="space-y-4 text-left order-last lg:order-first">
                <div className="inline-block rounded-lg bg-background/20 text-slate-900/80 px-3 py-1 text-sm font-semibold border border-border/30">
                  Nuestra Visión
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline text-slate-900">
                  Cultivar el Talento, Impulsar el Futuro de Alprigrama
                </h1>
                <p className="max-w-[600px] text-slate-900/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  NexusAlpri es más que una plataforma; es nuestro compromiso con el crecimiento. Nació de la necesidad de tener una herramienta de e-learning a la altura de nuestro equipo: ágil, potente e intuitiva. Nuestra misión es empoderar a cada colaborador de Alprigrama con el conocimiento para innovar, la confianza para liderar y las habilidades para construir juntos el próximo capítulo de nuestro éxito.
                </p>
              </div>
            </div>
        </section>

        <section className="w-full bg-transparent py-6 md:py-8 mt-6 md:mt-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 text-left max-w-4xl w-full">
                <div className="inline-block rounded-lg bg-background/20 text-slate-900/80 px-3 py-1 text-sm font-semibold border border-border/30">
                  Tecnología
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-slate-900">Ingeniería para la Excelencia</h2>
                <p className="max-w-[900px] text-slate-900/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hemos seleccionado un stack tecnológico de vanguardia, enfocado en ofrecer una experiencia de usuario que sea no solo funcional, sino también rápida, segura y un placer de usar. Cada tecnología fue elegida con un propósito claro: potenciar el aprendizaje.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {techStack.map((tech) => {
                 const Icon = tech.icon;
                 return (
                 <div 
                    key={tech.name}
                    className="group relative rounded-2xl p-6 text-left h-full transition-all duration-300 overflow-hidden bg-background/20 backdrop-blur-sm shadow-lg hover:shadow-primary/20 hover:-translate-y-2 border border-white/30"
                  >
                   <div className="relative z-10 flex flex-col items-start justify-start h-full">
                     <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white"/>
                     </div>
                     <h3 className="text-xl font-bold font-headline mt-4 text-slate-900">{tech.name}</h3>
                     <p className="text-sm text-slate-900/80 mt-2">{tech.description}</p>
                   </div>
                 </div>
              )})}
            </div>
        </section>
    </div>
  );
}
