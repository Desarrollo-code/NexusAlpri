// src/app/(public)/about/page.tsx
'use client'; // Convertido a Client Component

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Code, Wind, Feather } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '@/contexts/auth-context'; // Importar el hook de autenticación
import { GradientIcon } from '@/components/ui/gradient-icon';

export default function AboutPage() {
  // Obtener la configuración desde el contexto en lugar de la base de datos
  const { settings } = useAuth();
  const aboutImageUrl = settings?.aboutImageUrl || "https://placehold.co/600x400.png";

  const techStack = [
    { name: 'Next.js', description: 'Framework de React para producción.', icon: Code, color: "text-blue-400" },
    { name: 'TypeScript', description: 'Superset de JavaScript con tipos.', icon: Code, color: "text-blue-400" },
    { name: 'Prisma', description: 'ORM de nueva generación para Node.js.', icon: Database, color: "text-emerald-400" },
    { name: 'Tailwind CSS', description: 'Framework de CSS "utility-first".', icon: Wind, color: "text-cyan-400" },
    { name: 'ShadCN UI', description: 'Componentes UI reutilizables.', icon: Feather, color: "text-pink-400" },
  ];

  return (
    <div className="flex-1 z-10 w-full">
        <section className="w-full">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
               <div className="mx-auto aspect-video overflow-hidden rounded-xl w-full relative shadow-lg bg-muted order-first lg:order-last">
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
                <div className="inline-block rounded-lg bg-secondary text-secondary-foreground px-3 py-1 text-sm font-semibold">
                  Nuestra Misión
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline text-foreground">
                  Potenciando el Conocimiento, Impulsando el Crecimiento
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  NexusAlpri nació de la necesidad de una plataforma de e-learning corporativa que fuera a la vez potente y fácil de usar. Creemos que la formación continua es el motor del éxito organizacional y nuestra misión es proporcionar las herramientas para hacerlo posible.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-16 mt-12 md:mt-16 bg-muted/50 border-y">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary text-secondary-foreground px-3 py-1 text-sm font-semibold">
                  Tecnología
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-foreground">Construido con Herramientas Modernas</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Utilizamos un stack tecnológico de vanguardia para asegurar una experiencia de usuario rápida, segura y escalable.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {techStack.map((tech) => (
                <Card key={tech.name} className="hover:border-primary/50 transition-colors bg-card shadow-sm hover:shadow-primary/20">
                  <CardHeader className="flex flex-row items-center gap-4">
                     <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3 rounded-lg border">
                        <GradientIcon icon={tech.icon} size="lg" className={tech.color} />
                    </div>
                    <CardTitle>{tech.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{tech.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
    </div>
  );
}
