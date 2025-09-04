
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Course as AppCourseType } from '@/types';

interface CourseCreationFormProps {
  onSuccess: (newCourseId: string) => void;
}

export function CourseCreationForm({ onSuccess }: CourseCreationFormProps) {
  const { toast } = useToast();
  const { settings } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title || !description || !category) {
      toast({
        title: 'Campos Incompletos',
        description: 'Por favor, completa todos los campos para crear el curso.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el curso.');
      }

      const newCourse: AppCourseType = await response.json();
      onSuccess(newCourse.id);
      
    } catch (error) {
      toast({
        title: 'Error de Creación',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    
      
        
          Título del Curso
          
            Ej: Fundamentos de Marketing Digital
            
        
      
      
        
          Descripción Breve
          
            Una descripción corta que enganche a los estudiantes.
            
        
      
      
        
          Categoría
          
            
              
                Selecciona una categoría...
                {settings?.resourceCategories.sort().map((cat) => (
                  
                    {cat}
                  
                ))}
              
            
          
        
      
      
        
          
          {isSubmitting ? 'Creando...' : 'Crear y Continuar'}
        
      
    
  );
}
