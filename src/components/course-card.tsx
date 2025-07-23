

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
import { RocketIcon } from '@/components/icons/icon-rocket';

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
    <div className="group w-full h-[380px] perspective-1000">
      <div className="relative w-full h-full transform-style-3d transition-transform duration-700 group-hover:rotate-y-180">
        {/* Front of Card */}
        <div className="absolute w-full h-full backface-hidden rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-shadow duration-300 course-card">
          <Link href={`/courses/${course.id}`} className="block h-full">
            <div className="flex flex-col h-full">
              <div className="aspect-video w-full relative overflow-hidden course-image-container">
                  <Image
                    src={course.imageUrl || `https://placehold.co/600x400.png`}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105 course-image"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    data-ai-hint="online course abstract"
                    priority={priority}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-colors" />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  {typeof progress === 'number' && (
                      <div className="absolute top-2 right-2">
                          <CircularProgress value={progress} size={40} strokeWidth={4} valueTextClass="text-xs font-semibold" />
                      </div>
                  )}
              </div>
              <CardHeader className="p-4 flex-grow">
                <CardTitle className="text-base font-headline leading-tight mb-2 line-clamp-2">{course.title}</CardTitle>
                 <div className="text-xs text-muted-foreground pt-2 flex flex-col gap-2">
                  <div className="flex items-center"><User className="mr-1.5 h-3 w-3" /> Por {course.instructor}</div>
                  <div className="flex items-center"><Layers className="mr-1.5 h-3 w-3" /> {course.modulesCount} Módulos</div>
                </div>
              </CardHeader>
              <CardFooter className="p-4 border-t pt-3">
                 <EnrollmentButton isEnrolled={isEnrolled} courseId={course.id} handleEnrollment={handleEnrollment} isProcessing={isProcessingEnrollment} />
              </CardFooter>
            </div>
          </Link>
        </div>

        {/* Back of Card */}
        <div className="absolute w-full h-full backface-hidden rounded-lg overflow-hidden bg-muted rotate-y-180 course-card">
          <Link href={`/courses/${course.id}`} className="block h-full w-full">
            <div className="relative w-full h-full flex justify-center items-center rotating-gradient">
              <div className="absolute w-[calc(100%-2px)] h-[calc(100%-2px)] bg-card rounded-lg flex flex-col justify-center items-center gap-4 text-center p-4">
                  <div className="relative w-24 h-24">
                      <div className="absolute top-0 left-8 w-[90px] h-[90px] rounded-full bg-primary/50 filter blur-xl floating" />
                      <div className="absolute top-12 left-0 w-[150px] h-[150px] rounded-full bg-accent/30 filter blur-2xl floating" style={{animationDelay: '-800ms'}} />
                  </div>
                  <div className="z-10 flex flex-col items-center">
                    <RocketIcon className="w-16 h-16 text-primary drop-shadow-lg" />
                    <strong className="mt-4 font-headline text-lg text-foreground">Explorar Curso</strong>
                  </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
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
