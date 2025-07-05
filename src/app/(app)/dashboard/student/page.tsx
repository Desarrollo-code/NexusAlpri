import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookMarked, CheckCircle } from "lucide-react";
import Link from 'next/link';
import { courses } from '@/lib/data';

export default function StudentDashboard() {
  const myCourses = courses.slice(0, 2);
  const recommendedCourses = courses.slice(1, 3);

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-3xl font-bold font-headline">Hola, Estudiante</h1>
          <p className="text-muted-foreground">Continúa tu viaje de aprendizaje.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold font-headline">Mis Cursos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {myCourses.map(course => (
            <Card key={course.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                  <Image src={course.cover} alt={course.title} width={120} height={80} className="rounded-md" data-ai-hint={course.hint} />
                  <div className="flex-1">
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.instructor}</CardDescription>
                  </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-1 text-sm">
                    <span>Progreso</span>
                    <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} aria-label={`${course.progress}% completado`} />
              </CardContent>
              <CardFooter>
                 <Button className="w-full">Continuar Aprendizaje <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline">Tareas Pendientes</h2>
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-muted-foreground mr-4" />
                        <div>
                            <p>Completar Módulo 3 de Seguridad Digital</p>
                            <p className="text-sm text-muted-foreground">Vence: 10 de Julio, 2025</p>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-muted-foreground mr-4" />
                        <div>
                            <p>Realizar Quiz de Productividad</p>
                            <p className="text-sm text-muted-foreground">Vence: 12 de Julio, 2025</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold font-headline">Cursos Recomendados</h2>
            <Card>
                <CardContent className="pt-6 space-y-4">
                    {recommendedCourses.slice(0, 2).map(course => (
                        <div key={course.id} className="flex items-center gap-4">
                            <Image src={course.cover} alt={course.title} width={80} height={60} className="rounded-md" data-ai-hint={course.hint} />
                            <div className="flex-1">
                                <p className="font-semibold">{course.title}</p>
                                <p className="text-sm text-muted-foreground">{course.instructor}</p>
                            </div>
                            <Button variant="outline" size="sm">Ver</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>

    </div>
  )
}
