import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlusCircle } from "lucide-react";
import { courses } from "@/lib/data";

export default function CoursesPage() {
    // In a real app, this would be grouped by category from the backend
    const categories = {
        'Seguridad': courses.filter(c => c.id === 'CS101'),
        'Desarrollo Profesional': courses.filter(c => c.id === 'PD202'),
    }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Catálogo de Cursos</h1>
          <p className="text-muted-foreground">Explora y accede a las opciones de formación interna disponibles.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Curso
        </Button>
      </div>

      <div className="space-y-8">
        {Object.entries(categories).map(([category, categoryCourses]) => (
            <section key={category}>
                <h2 className="text-2xl font-semibold font-headline mb-4">{category}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categoryCourses.map(course => (
                         <Card key={course.id} className="flex flex-col">
                            <CardHeader className="p-0">
                                <Image 
                                    src={course.cover} 
                                    alt={course.title} 
                                    width={600} 
                                    height={400} 
                                    className="rounded-t-lg object-cover aspect-video"
                                    data-ai-hint={course.hint}
                                />
                            </CardHeader>
                            <CardContent className="pt-6 flex-1">
                                <CardTitle className="font-headline text-xl mb-2">{course.title}</CardTitle>
                                <CardDescription>{course.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-2">
                                <div className="w-full">
                                    <div className="flex justify-between mb-1 text-sm">
                                        <span>Progreso</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <Progress value={course.progress} aria-label={`${course.progress}% completado`} />
                                </div>
                                <Button className="w-full mt-2">
                                    Ver Curso
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        ))}
      </div>
    </div>
  )
}
