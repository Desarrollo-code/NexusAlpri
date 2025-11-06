// src/lib/course-utils.ts
import type { Course as AppCourseType, CourseStatus } from '@/types';
import type { Course as PrismaCourse } from '@prisma/client';

// Define a more specific type for the input expected by the mapper
// This helps ensure the function is used correctly.
interface ApiCourseForManage extends Omit<PrismaCourse, 'instructor' | 'status' | 'prerequisite' | 'isMandatory'> {
  instructor?: { id: string; name: string | null; avatar?: string | null; } | null;
  _count?: {
    modules?: number;
    enrollments?: number;
    lessons?: number; // Puede que venga de una agregación anidada
  };
  modules?: { _count?: { lessons: number } }[];
  status: CourseStatus;
  averageCompletion?: number;
  isMandatory: boolean;
}


export function mapApiCourseToAppCourse(apiCourse: ApiCourseForManage): AppCourseType {
  // CORRECCIÓN: Se calcula el total de lecciones de forma más robusta,
  // considerando diferentes formas en que los datos pueden llegar.
  const totalLessons = Array.isArray(apiCourse.modules)
    ? apiCourse.modules.reduce((acc, mod) => acc + (mod?._count?.lessons || 0), 0)
    : (apiCourse._count?.lessons ?? 0);
  
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description || '',
    category: apiCourse.category || undefined,
    // Aseguramos que siempre haya un objeto instructor.
    instructor: apiCourse.instructor ? {
        id: apiCourse.instructor.id,
        name: apiCourse.instructor.name || 'N/A',
        avatar: apiCourse.instructor.avatar || null,
    } : {
        id: 'unknown',
        name: 'N/A',
        avatar: null,
    },
    instructorId: apiCourse.instructorId || undefined,
    imageUrl: apiCourse.imageUrl || undefined,
    // CORRECCIÓN CLAVE: Se transfiere correctamente el conteo de módulos.
    modulesCount: apiCourse._count?.modules ?? 0,
    lessonsCount: totalLessons,
    enrollmentsCount: apiCourse._count?.enrollments ?? 0,
    averageCompletion: apiCourse.averageCompletion,
    status: apiCourse.status,
    modules: [], // Los módulos completos no son necesarios para las tarjetas.
    isEnrolled: undefined, // Se determina en el lado del cliente.
    isMandatory: apiCourse.isMandatory || false,
    prerequisite: (apiCourse as any).prerequisite,
    prerequisiteCompleted: (apiCourse as any).prerequisiteCompleted,
    certificateTemplateId: apiCourse.certificateTemplateId
  };
}
