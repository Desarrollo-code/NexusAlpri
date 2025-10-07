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
  const aboutImageUrl = settings?.aboutImageUrl || "https://placehold.co/600x400/38bdf8/ffffff?text=Nuestra+Misi%C3%B3n";

  const techStack = [
    { name: 'Next.js', description: 'Para un rendimiento excepcional y una experiencia de usuario fluida gracias a su arquitectura híbrida.', icon: Code, color: "text-blue-500" },
    { name: 'TypeScript', description: 'Para un código más seguro, mantenible y escalable, reduciendo errores en producción.', icon: Code, color: "text-blue-500" },
    { name: 'Prisma', description: 'Como ORM de nueva generación, simplifica y asegura las interacciones con la base de datos.', icon: Database, color: "text-emerald-500" },
    { name: 'Tailwind CSS', description: 'Nos permite construir interfaces complejas y personalizadas de forma rápida y consistente.', icon: Wind, color: "text-cyan-500" },
    { name: 'ShadCN UI', description: 'Para componentes de UI accesibles, reutilizables y estéticamente agradables desde el primer día.', icon: Feather, color: "text-pink-500" },
  ];

  return (
    <div className="flex-1 z-10 w-full">
        <section className="w-full">
          <div className="container px-4 md:px-6">
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
              <div className="space-y-4 order-last lg:order-first">
                <div className="inline-block rounded-lg bg-background/20 text-foreground/80 px-3 py-1 text-sm font-semibold border border-border/30">
                  Nuestra Misión
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline text-foreground">
                  Democratizar la Formación Corporativa de Alto Nivel
                </h1>
                <p className="max-w-[600px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
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
                <div className="inline-block rounded-lg bg-background/20 text-foreground/80 px-3 py-1 text-sm font-semibold border border-border/30">
                  Tecnología
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-foreground">Ingeniería para la Excelencia</h2>
                <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hemos seleccionado cuidadosamente un stack tecnológico moderno y robusto, enfocado en ofrecer una experiencia de usuario rápida, segura y preparada para el futuro.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {techStack.map((tech) => (
                <Card key={tech.name} className="bg-background/20 border-border/30 hover:border-primary/50 transition-colors shadow-lg hover:shadow-primary/20">
                  <CardHeader className="flex flex-row items-center gap-4">
                     <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-lg border border-border/30">
                        <GradientIcon icon={tech.icon} size="lg" className={tech.color} />
                    </div>
                    <CardTitle className="text-foreground">{tech.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/70">{tech.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
    </div>
  );
}
