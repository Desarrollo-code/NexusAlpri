// src/app/(public)/about/page.tsx
'use client'; 

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Code, Wind, Feather } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { GradientIcon } from '@/components/ui/gradient-icon';

export default function AboutPage() {
  const { settings } = useAuth();
  const aboutImageUrl = settings?.aboutImageUrl || "https://placehold.co/600x400.png";

  const techStack = [
    { name: 'Next.js', description: 'Para un rendimiento excepcional y una experiencia de usuario fluida gracias a su arquitectura híbrida.', icon: Code, color: "text-blue-400" },
    { name: 'TypeScript', description: 'Para un código más seguro, mantenible y escalable, reduciendo errores en producción.', icon: Code, color: "text-blue-400" },
    { name: 'Prisma', description: 'Como ORM de nueva generación, simplifica y asegura las interacciones con la base de datos.', icon: Database, color: "text-emerald-400" },
    { name: 'Tailwind CSS', description: 'Nos permite construir interfaces complejas y personalizadas de forma rápida y consistente.', icon: Wind, color: "text-cyan-400" },
    { name: 'ShadCN UI', description: 'Para componentes de UI accesibles, reutilizables y estéticamente agradables desde el primer día.', icon: Feather, color: "text-pink-400" },
  ];

  return (
    <div className="flex-1 z-10 w-full text-white">
        <section className="w-full">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
               <div className="mx-auto aspect-video overflow-hidden rounded-xl w-full relative shadow-lg bg-white/10 border border-white/10 order-first lg:order-last">
                <Image
                  src={aboutImageUrl}
                  alt="About Us"
                  fill
                  quality={100}
                  className="object-cover"
                  data-ai-hint="team collaboration"
                />
              </div>
              <div className="space-y-4 order-last lg:order-first">
                <div className="inline-block rounded-lg bg-white/10 text-white/90 px-3 py-1 text-sm font-semibold border border-white/20">
                  Nuestra Misión
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline text-white">
                  Democratizando la Formación Corporativa de Alto Nivel
                </h1>
                <p className="max-w-[600px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  NexusAlpri nació para resolver una necesidad crítica: las empresas necesitaban una herramienta de e-learning que fuera tan potente como las soluciones empresariales, pero tan intuitiva como las aplicaciones de uso diario. Nuestra misión es simple: empoderar a cada organización para que construya una cultura de aprendizaje continuo, sin las barreras del costo o la complejidad técnica.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 mt-12 md:mt-16 bg-transparent">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-white/10 text-white/90 px-3 py-1 text-sm font-semibold border border-white/20">
                  Tecnología
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-white">Ingeniería para la Excelencia</h2>
                <p className="max-w-[900px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hemos seleccionado cuidadosamente un stack tecnológico moderno y robusto, enfocado en ofrecer una experiencia de usuario rápida, segura y preparada para el futuro.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {techStack.map((tech) => (
                <Card key={tech.name} className="bg-white/5 border-white/10 hover:border-blue-400/50 transition-colors shadow-lg hover:shadow-blue-500/20">
                  <CardHeader className="flex flex-row items-center gap-4">
                     <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3 rounded-lg border border-white/10">
                        <GradientIcon icon={tech.icon} size="lg" className={tech.color} />
                    </div>
                    <CardTitle className="text-white">{tech.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70">{tech.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
    </div>
  );
}
