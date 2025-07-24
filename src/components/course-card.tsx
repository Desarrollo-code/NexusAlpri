
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Course as AppCourse, EnrolledCourse, UserRole } from '@/types';
import { Layers, ArrowRight, Check, Plus, Loader2, X, User } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { cn } from '@/lib/utils';


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

  return (
    <Card className="group flex flex-col h-full overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
      <Link href={`/courses/${course.id}`} className="block h-full flex flex-col">
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
           {typeof progress === 'number' && (
              <div className="absolute top-2 right-2">
                  <CircularProgress value={progress} size={40} strokeWidth={4} valueTextClass="text-xs font-semibold" />
              </div>
          )}
        </div>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-headline leading-tight mb-2 line-clamp-2">{course.title}</CardTitle>
          <div className="text-xs text-muted-foreground pt-2 flex flex-col gap-2">
            <div className="flex items-center"><User className="mr-1.5 h-3 w-3" /> Por {course.instructor}</div>
            <div className="flex items-center"><Layers className="mr-1.5 h-3 w-3" /> {course.modulesCount} Módulos</div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        </CardContent>
        <CardFooter className="p-4 border-t pt-3">
          <EnrollmentButton isEnrolled={isEnrolled} courseId={course.id} handleEnrollment={handleEnrollment} isProcessing={isProcessingEnrollment} />
        </CardFooter>
      </Link>
    </Card>
  );
}


const EnrollmentButton = ({ isEnrolled, handleEnrollment, isProcessing }: {
  isEnrolled: boolean;
  courseId: string;
  handleEnrollment: (e: React.MouseEvent, enroll: boolean) => void;
  isProcessing: boolean;
}) => {
  if (isEnrolled) {
    return (
      <Button asChild className="w-full" size="sm">
        <span className="cursor-pointer">
          Continuar Curso <ArrowRight className="ml-2" />
        </span>
      </Button>
    );
  }

  return (
    <Button onClick={(e) => handleEnrollment(e, true)} disabled={isProcessing} className="w-full" size="sm">
      {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2" />}
      Inscribirse
    </Button>
  );
};
