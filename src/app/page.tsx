
// src/app/page.tsx
import { Button } from '@/components/ui/button';
import { RocketIcon } from '@/components/icons/icon-rocket';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex-1 w-full">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    NexusAlpri: El Futuro del Aprendizaje Corporativo.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Una plataforma integral diseñada para transformar la formación en tu organización. Crea, gestiona y mide el impacto de tu contenido con facilidad.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/about"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    Leer Más
                  </Link>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                data-ai-hint="startup launch rocket"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
