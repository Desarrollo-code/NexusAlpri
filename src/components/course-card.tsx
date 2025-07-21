

'use client';

import React, from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Course as AppCourse, EnrolledCourse, UserRole } from '@/types';
import { Layers, ArrowRight, Check, Plus, Loader2, X, User } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';

interface CourseCardProps {
  course: AppCourse | EnrolledCourse;
  userRole: UserRole | null;
  onEnrollmentChange?: (courseId: string, newStatus: boolean) => void;
  priority?: boolean;
}

export function CourseCard({ course, userRole, onEnrollmentChange, priority = false }: CourseCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isEnrolled = (course as EnrolledCourse).isEnrolled ?? false;
  const [isProcessingEnrollment, setIsProcessingEnrollment] = React.useState(false);

  const progress = (course as EnrolledCourse).progressPercentage;

  const handleEnrollment = async (e: React.MouseEvent, enroll: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({ title: 'Acción Requerida', description: 'Por favor, inicia sesión para inscribirte.', variant: 'destructive' });
      return;
    }

    setIsProcessingEnrollment(true);

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, enroll }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la inscripción');
      }
      
      if (onEnrollmentChange) {
        onEnrollmentChange(course.id, enroll);
      }
      
      toast({
        title: enroll ? '¡Inscripción Exitosa!' : 'Inscripción Cancelada',
        description: `Has ${enroll ? 'añadido' : 'quitado'} el curso "${course.title}" de tu lista.`,
      });

    } catch (error) {
      toast({
        title: 'Error de Inscripción',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessingEnrollment(false);
    }
  };

  const EnrollmentButton = () => {
    if (isEnrolled) {
      return (
        <Button asChild className="w-full" size="sm">
          <Link href={`/courses/${course.id}`}>
            Continuar Curso <ArrowRight className="ml-2" />
          </Link>
        </Button>
      );
    }

    return (
      <Button onClick={(e) => handleEnrollment(e, true)} disabled={isProcessingEnrollment} className="w-full" size="sm">
        {isProcessingEnrollment ? (
          <Loader2 className="mr-2 animate-spin" />
        ) : (
          <Plus className="mr-2" />
        )}
        Inscribirse
      </Button>
    );
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out card-border-beam group">
      <Link href={`/courses/${course.id}`} className="block">
        <div className="aspect-video w-full relative overflow-hidden">
            <Image
              src={course.imageUrl || `https://placehold.co/600x400.png`}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint="online course abstract"
              priority={priority}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
             {typeof progress === 'number' && (
                <div className="absolute top-2 right-2">
                    <CircularProgress value={progress} size={40} strokeWidth={4} valueTextClass="text-xs font-semibold" />
                </div>
            )}
        </div>
      </Link>
      <CardHeader className="p-4 flex-grow">
        <CardTitle className="text-lg font-headline leading-tight mb-2 line-clamp-2">{course.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 flex-grow">{course.description}</CardDescription>
        <div className="text-xs text-muted-foreground pt-3 flex flex-col gap-2">
          <div className="flex items-center">
            <User className="mr-1.5 h-3 w-3" /> Por {course.instructor}
          </div>
          <div className="flex items-center">
            <Layers className="mr-1.5 h-3 w-3" /> {course.modulesCount} Módulos
          </div>
        </div>
      </CardHeader>
      <CardFooter className="p-4 border-t pt-4">
        <EnrollmentButton />
      </CardFooter>
    </Card>
  );
}
