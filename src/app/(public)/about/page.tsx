// src/app/(public)/about/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Code, Wind, Feather } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

export default function AboutPage() {
  const techStack = [
    { name: 'Next.js', description: 'Framework de React para producción.', icon: <Code />, color: "text-primary" },
    { name: 'TypeScript', description: 'Superset de JavaScript con tipos.', icon: <Code />, color: "text-primary" },
    { name: 'Prisma', description: 'ORM de nueva generación para Node.js.', icon: <Database />, color: "text-primary" },
    { name: 'Tailwind CSS', description: 'Framework de CSS "utility-first".', icon: <Wind />, color: "text-primary" },
    { name: 'ShadCN UI', description: 'Componentes UI reutilizables.', icon: <Feather />, color: "text-primary" },
  ];

  return (
    <>
        <section className="w-full py-12 md:py-24 lg:py-32 z-10">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold">
                  Nuestra Misión
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline text-foreground">
                  Potenciando el Conocimiento, Impulsando el Crecimiento
                </h1>
                <p className="max-w-[600px] text-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  NexusAlpri nació de la necesidad de una plataforma de e-learning corporativa que fuera a la vez potente y fácil de usar. Creemos que la formación continua es el motor del éxito organizacional y nuestra misión es proporcionar las herramientas para hacerlo posible.
                </p>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="About Us"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full shadow-2xl"
                data-ai-hint="team collaboration"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 z-10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-semibold">
                  Tecnología
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-foreground">Construido con Herramientas Modernas</h2>
                <p className="max-w-[900px] text-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Utilizamos un stack tecnológico de vanguardia para asegurar una experiencia de usuario rápida, segura y escalable.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {techStack.map((tech) => (
                <Card key={tech.name} className="hover:border-primary/50 transition-colors bg-card/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className={'bg-primary/20 p-3 rounded-full text-primary'}>
                        {React.cloneElement(tech.icon, { className: "h-6 w-6" })}
                    </div>
                    <CardTitle className="text-foreground">{tech.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{tech.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
