
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Course as AppCourse, EnrolledCourse, UserRole } from '@/types';
import { Layers, ArrowRight, Check, Plus, Loader2, X } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';

interface CourseCardProps {
  course: AppCourse | EnrolledCourse;
  userRole: UserRole | null;
  onEnrollmentChange?: (courseId: string, newStatus: boolean) => void;
}

export function CourseCard({ course, userRole, onEnrollmentChange }: CourseCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isEnrolledInitially = (course as EnrolledCourse).isEnrolled ?? false;
  const [isEnrolled, setIsEnrolled] = useState(isEnrolledInitially);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);

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
        body: JSON.stringify({ courseId: course.id, enroll: enroll }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la inscripción');
      }
      
      setIsEnrolled(enroll);
      if (onEnrollmentChange) {
        onEnrollmentChange(course.id, enroll);
      }
      
      if (enroll) {
        toast({
          title: '¡Inscripción Exitosa!',
          description: `El curso "${course.title}" ha sido añadido. Lo encontrarás en la sección 'Mis Cursos'.`,
        });
      } else {
        toast({
            title: 'Inscripción Cancelada',
            description: `Has cancelado tu inscripción a "${course.title}".`,
        });
      }

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
    // Show "View Course" for instructors/admins, as they don't "enroll" in the same way
    if (user && (user.role === 'ADMINISTRATOR' || (user.role === 'INSTRUCTOR' && user.id === course.instructorId))) {
      return (
        <Button asChild className="w-full" size="sm">
          <Link href={`/courses/${course.id}`}>
            Ver Detalles <ArrowRight className="ml-2" />
          </Link>
        </Button>
      );
    }
    
    // Logic for students, and instructors/admins viewing other courses
    if (isEnrolled) {
      return (
        <div className="grid grid-cols-2 gap-2 w-full">
            <Button asChild variant="secondary" size="sm">
                <Link href={`/courses/${course.id}`}>
                    Continuar <ArrowRight className="ml-2" />
                </Link>
            </Button>
             <Button variant="outline" size="sm" onClick={(e) => handleEnrollment(e, false)} disabled={isProcessingEnrollment}>
                 {isProcessingEnrollment ? ( <Loader2 className="animate-spin" /> ) : <X className="h-4 w-4" />}
            </Button>
        </div>
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
    <Card className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <Link href={`/courses/${course.id}`} className="block">
        <CardHeader className="p-0 relative">
          <div className="aspect-video w-full relative">
            <Image
              src={course.imageUrl || `https://placehold.co/600x400.png`}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint="online course abstract"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="absolute bottom-0 p-4">
              <CardTitle className="text-white text-lg font-headline drop-shadow-md">{course.title}</CardTitle>
          </div>
        </CardHeader>
      </Link>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start">
            <div className="flex-grow pr-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    Por {course.instructor}
                </p>
                <div className="text-xs text-muted-foreground mt-2 flex items-center">
                    <Layers className="mr-1.5 h-3 w-3" /> {course.modulesCount} Módulos
                </div>
            </div>
            {typeof progress === 'number' && (
                <div className="shrink-0">
                    <CircularProgress value={progress} size={40} strokeWidth={4} valueTextClass="text-xs font-semibold" />
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t pt-4">
        <EnrollmentButton />
      </CardFooter>
    </Card>
  );
}
