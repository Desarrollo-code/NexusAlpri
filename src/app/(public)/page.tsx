// src/app/(public)/page.tsx
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, UserCircle, LockKeyhole } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LandingPage() {
  return (
      <div className="flex-1 w-full">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-grainy-gradient">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-7xl/none font-headline text-foreground">
                    Despierta el Potencial
                    <br />
                    <span className="text-primary">de tu Equipo.</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    La plataforma de e-learning corporativa que se adapta a ti.
                    Crea, gestiona y mide el impacto de la formación en tu organización de manera sencilla y eficaz.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link
                      href="/courses"
                    >
                      Explorar Cursos <BookOpen className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                   <Button asChild size="lg" variant="outline">
                    <Link
                      href="/about"
                    >
                      Ver Demo <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Image
                    src="https://placehold.co/600x600.png"
                    width="600"
                    height="600"
                    alt="Hero"
                    className="mx-auto aspect-square overflow-hidden rounded-xl object-cover"
                    data-ai-hint="corporate training modern"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}
