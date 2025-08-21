
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Course as AppCourse, EnrolledCourse, UserRole, CourseStatus } from '@/types';
import { Layers, ArrowRight, Check, Plus, Loader2, X, User, Edit, MoreVertical, Eye, BookOpenCheck, Trash2 } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';

interface CourseCardProps {
  course: AppCourse | EnrolledCourse;
  userRole: UserRole | null;
  onEnrollmentChange?: (courseId: string, newStatus: boolean) => void;
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
  onDelete?: (course: AppCourse) => void;
  priority?: boolean;
  viewMode?: 'catalog' | 'management';
}

const TRUNCATE_LENGTH = 120;

const getStatusInSpanish = (status: CourseStatus) => {
    switch (status) {
        case 'DRAFT': return 'Borrador';
        case 'PUBLISHED': return 'Publicado';
        case 'ARCHIVED': return 'Archivado';
        case 'SCHEDULED': return 'Programado';
        default: return status;
    }
}

export function CourseCard({ 
  course, 
  userRole, 
  onEnrollmentChange, 
  onStatusChange,
  onDelete,
  priority = false, 
  viewMode = 'catalog' 
}: CourseCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = React.useState(false);
  const [isProcessingStatus, setIsProcessingStatus] = React.useState(false);

  const isEnrolled = 'isEnrolled' in course ? course.isEnrolled : undefined;
  const progress = 'progressPercentage' in course ? course.progressPercentage : undefined;

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
      
      onEnrollmentChange?.(course.id, enroll);
      
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

  const isTruncated = course.description && course.description.length > TRUNCATE_LENGTH;
  const descriptionToShow = isExpanded
    ? course.description
    : `${''}${course.description?.substring(0, TRUNCATE_LENGTH)}`;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const mainLinkHref = viewMode === 'management' ? `/manage-courses/${course.id}/edit` : `/courses/${course.id}`;

  return (
    <Card className="group flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out">
        <Link href={mainLinkHref}>
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
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
                {typeof progress === 'number' && (
                    <div className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm rounded-full">
                        <CircularProgress value={progress} size={40} strokeWidth={4} valueTextClass="text-xs font-semibold" />
                    </div>
                )}
                {viewMode === 'management' && (
                    <Badge className="absolute top-2 left-2" variant={course.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {getStatusInSpanish(course.status)}
                    </Badge>
                )}
            </div>
        </Link>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-headline leading-tight mb-1 line-clamp-2">
             <Link href={mainLinkHref} className="animated-underline">{course.title}</Link>
          </CardTitle>
          <div className="text-xs text-muted-foreground pt-1 flex flex-col gap-1.5">
            <div className="flex items-center"><User className="mr-1.5 h-3 w-3" /> Por {course.instructor}</div>
            <div className="flex items-center"><Layers className="mr-1.5 h-3 w-3" /> {course.modulesCount} Módulos</div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          {course.description && (
            <p className="text-sm text-muted-foreground">
              {descriptionToShow}
              {isTruncated && !isExpanded && '... '}
              {isTruncated && (
                 <button
                    onClick={toggleExpand}
                    className="text-primary font-semibold animated-underline"
                >
                    {isExpanded ? 'Leer menos' : 'Leer más'}
                </button>
              )}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t pt-3 flex items-center justify-between mt-auto">
            {viewMode === 'catalog' && (
                <EnrollmentButton isEnrolled={isEnrolled} handleEnrollment={handleEnrollment} isProcessing={isProcessingEnrollment} mainLinkHref={mainLinkHref} />
            )}
            {viewMode === 'management' && (
              <>
                <Button asChild size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/manage-courses/${course.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </Link>
                </Button>
                <ManagementDropdown course={course} onStatusChange={onStatusChange} onDelete={onDelete} isProcessing={isProcessingStatus} />
              </>
            )}
        </CardFooter>
    </Card>
  );
}


const EnrollmentButton = ({ isEnrolled, handleEnrollment, isProcessing, mainLinkHref }: {
  isEnrolled?: boolean;
  handleEnrollment: (e: React.MouseEvent, enroll: boolean) => void;
  isProcessing: boolean;
  mainLinkHref: string;
}) => {
  if (isEnrolled) {
    return (
      <Button asChild className="w-full" size="sm">
        <Link href={mainLinkHref}>
          Continuar Curso <ArrowRight className="ml-2" />
        </Link>
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

const ManagementDropdown = ({ course, onStatusChange, onDelete, isProcessing }: {
    course: AppCourse,
    onStatusChange?: (courseId: string, newStatus: CourseStatus) => void,
    onDelete?: (course: AppCourse) => void,
    isProcessing: boolean,
}) => {
    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        e.preventDefault();
        action();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                    <MoreVertical className="h-4 w-4"/>
                    <span className="sr-only">Más opciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                <DropdownMenuItem asChild>
                    <Link href={`/courses/${course.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/> Vista Previa</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'PUBLISHED'))} disabled={isProcessing || course.status === 'PUBLISHED'}>
                    <BookOpenCheck className="mr-2 h-4 w-4 text-green-500" /> Publicar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'DRAFT'))} disabled={isProcessing || course.status === 'DRAFT'}>
                     <Edit className="mr-2 h-4 w-4 text-blue-500" /> Pasar a Borrador
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'ARCHIVED'))} disabled={isProcessing || course.status === 'ARCHIVED'}>
                     <Layers className="mr-2 h-4 w-4 text-orange-500" /> Archivar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onDelete?.(course))} disabled={isProcessing} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4"/> Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
