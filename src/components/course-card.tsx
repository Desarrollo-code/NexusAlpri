// src/components/course-card.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Course as AppCourseType, EnrolledCourse, UserRole, CourseStatus } from '@/types';
import { Layers, ArrowRight, Check, Plus, Loader2, X, User, Edit, MoreVertical, Eye, BookOpenCheck, Trash2, Users, AlertTriangle, Lock, Download, Award, FileText } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Identicon } from './ui/identicon';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';


interface CourseCardProps {
  course: AppCourseType | EnrolledCourse;
  userRole: UserRole | null;
  onEnrollmentChange?: (courseId: string, newStatus: boolean) => void;
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
  onDelete?: (course: AppCourseType) => void;
  onAssign?: (course: AppCourseType) => void;
  priority?: boolean;
  viewMode?: 'catalog' | 'management';
}

const getStatusInSpanish = (status: CourseStatus) => {
    switch (status) {
        case 'DRAFT': return 'Borrador';
        case 'PUBLISHED': return 'Publicado';
        case 'ARCHIVED': return 'Archivado';
        default: return status;
    }
};

export function CourseCard({ 
  course, 
  userRole, 
  onEnrollmentChange, 
  onStatusChange,
  onDelete,
  onAssign,
  priority = false, 
  viewMode = 'catalog' 
}: CourseCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = React.useState(false);
  const [isProcessingStatus, setIsProcessingStatus] = React.useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = React.useState(false);

  const isEnrolled = 'isEnrolled' in course ? course.isEnrolled : undefined;
  const progress = 'progressPercentage' in course ? course.progressPercentage : undefined;
  
  const prerequisiteMet = course.prerequisiteCompleted === undefined ? true : course.prerequisiteCompleted;
  const isLocked = viewMode === 'catalog' && !prerequisiteMet && !isEnrolled;
  
  const enrollmentId = 'enrollmentId' in course ? course.enrollmentId : null;
  const isCompleted = progress === 100;

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
        body: JSON.stringify({ courseId: course.id, userId: user.id, enroll }),
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
      setShowUnenrollConfirm(false);
    }
  };
  
  const TRUNCATE_LENGTH = 120;
  const isTruncated = course.description && course.description.length > TRUNCATE_LENGTH;
  const descriptionToShow = isExpanded
    ? course.description
    : `${course.description?.substring(0, TRUNCATE_LENGTH)}`;

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const mainLinkHref = viewMode === 'management' ? `/manage-courses/${course.id}/edit` : `/courses/${course.id}`;
  
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isLocked && course.prerequisite) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent>
              <p>Debes completar "<strong>{course.prerequisite.title}</strong>" para inscribirte.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return <>{children}</>;
  };

  if (isCompleted && viewMode === 'catalog') {
      return (
        <Card className="flex items-center p-4 bg-card border-l-4 border-green-500">
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Award className="w-7 h-7" />
                </div>
            </div>
            <div className="flex-grow ml-4">
                <p className="font-semibold text-foreground">{course.title}</p>
                <p className="text-sm text-green-600 font-medium">¡Felicidades por aprobar el curso!</p>
            </div>
            <div className="flex-shrink-0 ml-4">
                 {course.certificateTemplateId && enrollmentId ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild variant="outline" size="icon" className="rounded-full border-2 border-primary/50 text-primary hover:bg-primary/10">
                                    <Link href={`/certificates/${enrollmentId}/view`} target="_blank">
                                        <Download className="h-5 w-5"/>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Descargar certificado</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                 ) : null}
            </div>
        </Card>
      )
  }

  return (
      <CardWrapper>
          <Card className={cn(
              "group flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out",
              isLocked ? "grayscale opacity-80 cursor-not-allowed" : "hover:border-primary/50 hover:shadow-lg"
            )}>
              <Link href={isLocked ? '#' : mainLinkHref} className={cn(isLocked && "pointer-events-none")}>
                  <div className="aspect-video w-full relative overflow-hidden bg-muted/30">
                      <Image
                          src={course.imageUrl || `https://placehold.co/600x400.png`}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          data-ai-hint="online course abstract"
                          quality={100}
                          priority={priority}
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                      {isLocked && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Lock className="h-10 w-10 text-white/80"/>
                          </div>
                      )}
                      {typeof progress === 'number' && !isCompleted && (
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
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base font-headline leading-tight mb-1 line-clamp-2">
                      <Link href={isLocked ? '#' : mainLinkHref} className={cn("animated-underline", isLocked && "pointer-events-none")}>{course.title}</Link>
                  </CardTitle>
                  {viewMode === 'catalog' && isEnrolled && (
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-1 shrink-0" onClick={e => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4"/>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onSelect={() => setShowUnenrollConfirm(true)}>
                                  <X className="mr-2 h-4 w-4"/> Cancelar Inscripción
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  )}
                </div>
                <div className="text-xs text-muted-foreground pt-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={course.instructor?.avatar || undefined} />
                        <AvatarFallback className="text-xs"><Identicon userId={course.instructor?.id || ''}/></AvatarFallback>
                    </Avatar>
                    <span>Por {course.instructor?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="flex items-center"><Layers className="mr-1.5 h-3 w-3" /> {course.modulesCount || 0} Módulos</span>
                     <span className="flex items-center"><FileText className="mr-1.5 h-3 w-3" /> {course.lessonsCount || 0} Lecciones</span>
                  </div>
                  {course.prerequisite && (
                    <div className="flex items-center text-primary/80"><Lock className="mr-1.5 h-3 w-3" /> Requiere: {course.prerequisite.title}</div>
                  )}
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
                      <EnrollmentButton isEnrolled={isEnrolled} isLocked={isLocked} handleEnrollment={handleEnrollment} isProcessing={isProcessingEnrollment} mainLinkHref={mainLinkHref} />
                  )}
                  {viewMode === 'management' && (
                    <>
                      <div className="text-xs text-muted-foreground flex items-center gap-4">
                         <span className="flex items-center gap-1.5"><Users className="h-3 w-3"/>{course.enrollmentsCount}</span>
                         <span className="flex items-center gap-1.5"><Check className="h-3 w-3"/>{Math.round(course.averageCompletion || 0)}%</span>
                      </div>
                      <ManagementDropdown course={course} onStatusChange={onStatusChange} onDelete={onDelete} onAssign={() => onAssign?.(course)} isProcessing={isProcessingStatus} />
                    </>
                  )}
              </CardFooter>
          </Card>
          <AlertDialog open={showUnenrollConfirm} onOpenChange={setShowUnenrollConfirm}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>¿Estás seguro de cancelar la inscripción?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Perderás todo tu progreso en el curso "<strong>{course.title}</strong>" y tendrás que volver a inscribirte para acceder a él. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel disabled={isProcessingEnrollment}>No, mantener inscripción</AlertDialogCancel>
                      <AlertDialogAction onClick={(e) => handleEnrollment(e, false)} disabled={isProcessingEnrollment} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                          {isProcessingEnrollment && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Sí, cancelar mi inscripción
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
        </AlertDialog>
      </CardWrapper>
  );
}


const EnrollmentButton = ({ isEnrolled, isLocked, handleEnrollment, isProcessing, mainLinkHref }: {
  isEnrolled?: boolean;
  isLocked: boolean;
  handleEnrollment: (e: React.MouseEvent, enroll: boolean) => void;
  isProcessing: boolean;
  mainLinkHref: string;
}) => {
  if (isLocked) {
    return (
       <Button disabled className="w-full" size="sm">
            <Lock className="mr-2 h-4 w-4" />
            Bloqueado
        </Button>
    )
  }

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

const ManagementDropdown = ({ course, onStatusChange, onDelete, onAssign, isProcessing }: {
    course: AppCourseType,
    onStatusChange?: (courseId: string, newStatus: CourseStatus) => void,
    onDelete?: (course: AppCourseType) => void,
    onAssign?: () => void,
    isProcessing: boolean,
}) => {
    const handleAction = (e: React.MouseEvent, action?: () => void) => {
        e.stopPropagation();
        e.preventDefault();
        action?.();
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
                <DropdownMenuItem asChild><Link href={`/manage-courses/${course.id}/edit`}><Edit className="mr-2 h-4 w-4"/> Editar</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href={`/courses/${course.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/> Vista Previa</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href={`/enrollments?courseId=${course.id}`}><Users className="mr-2 h-4 w-4"/> Ver Inscritos</Link></DropdownMenuItem>
                {course.isMandatory && <DropdownMenuItem onSelect={(e) => handleAction(e, onAssign)}><Users className="mr-2 h-4 w-4"/>Asignar Curso</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'PUBLISHED'))} disabled={isProcessing || course.status === 'PUBLISHED'}>Publicar</DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'ARCHIVED'))} disabled={isProcessing || course.status === 'ARCHIVED'}>Archivar</DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onStatusChange?.(course.id, 'DRAFT'))} disabled={isProcessing || course.status === 'DRAFT'}>Mover a Borrador</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => handleAction(e, () => onDelete?.(course))} disabled={isProcessing} className="text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/> Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
