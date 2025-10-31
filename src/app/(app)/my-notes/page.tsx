// src/app/(app)/my-notes/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Notebook, BookOpen, Layers, HelpCircle } from 'lucide-react';
import type { UserNote } from '@/types';
import { useTitle } from '@/contexts/title-context';
import { StickyNoteCard } from '@/components/sticky-note-card';
import { useTour } from '@/contexts/tour-context';
import { myNotesTour } from '@/lib/tour-steps';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';

interface NoteWithRelations extends UserNote {
  lesson: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
}

interface NotesByCourse {
  courseId: string;
  courseTitle: string;
  modules: {
    moduleId: string;
    moduleTitle: string;
    notes: NoteWithRelations[];
  }[];
}

export default function MyNotesPage() {
  const { user, isLoading: isAuthLoading, settings } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();
  const { startTour, forceStartTour } = useTour();

  const [notes, setNotes] = useState<NoteWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Mis Apuntes');
    startTour('myNotes', myNotesTour);
  }, [setPageTitle, startTour]);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notes');
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch notes');
      }
      const allNotes: NoteWithRelations[] = await response.json();
      setNotes(allNotes);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({ title: 'Error', description: 'No se pudieron cargar tus apuntes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!isAuthLoading && user) {
        fetchNotes();
    } else if (!isAuthLoading && !user) {
        setIsLoading(false);
    }
  }, [isAuthLoading, user, fetchNotes]);

  const handleNoteUpdate = (noteId: string, updates: Partial<UserNote>) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));
  };

  const handleNoteDelete = async (noteId: string) => {
      const originalNotes = [...notes];
      setNotes(prev => prev.filter(n => n.id !== noteId));
      
      try {
          const response = await fetch(`/api/notes`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ noteId })
          });
          if (!response.ok) {
              throw new Error('No se pudo eliminar la nota.');
          }
          toast({ title: "Nota Eliminada" });
      } catch (error) {
          toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
          setNotes(originalNotes);
      }
  };


  const notesByCourse = useMemo(() => {
    const groupedByCourse = notes.reduce((acc, note) => {
        const courseId = note.lesson.module.course.id;
        const courseTitle = note.lesson.module.course.title;
        const moduleId = note.lesson.module.id;
        const moduleTitle = note.lesson.module.title;

        if (!acc[courseId]) {
          acc[courseId] = { courseId, courseTitle, modules: {} };
        }
        if (!acc[courseId].modules[moduleId]) {
          acc[courseId].modules[moduleId] = { moduleId, moduleTitle, notes: [] };
        }
        acc[courseId].modules[moduleId].notes.push(note);
        
        return acc;
      }, {} as Record<string, { courseId: string; courseTitle: string; modules: Record<string, { moduleId: string, moduleTitle: string, notes: NoteWithRelations[] }> }>);
      
      return Object.values(groupedByCourse).map(courseGroup => ({
          courseId: courseGroup.courseId,
          courseTitle: courseGroup.courseTitle,
          modules: Object.values(courseGroup.modules)
      }));
  }, [notes]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
                <p id="my-notes-header" className="text-muted-foreground">Aquí encontrarás todos los apuntes que has tomado, organizados en un tablero virtual por curso y módulo.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => forceStartTour('myNotes', myNotesTour)}>
                <HelpCircle className="mr-2 h-4 w-4" /> Ver Guía
            </Button>
        </div>

      <div id="my-notes-board" className="space-y-12">
        {error ? (
          <div className="text-center py-12 text-destructive">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p>Error al cargar: {error}</p>
          </div>
        ) : notesByCourse.length === 0 ? (
          <EmptyState 
            icon={Notebook} 
            title="Tu tablero de apuntes está vacío" 
            description="Ve a una lección y comienza a escribir para que tus notas aparezcan aquí."
            imageUrl={settings?.emptyStateMyNotesUrl}
          />
        ) : (
          notesByCourse.map((courseGroup) => (
            <div key={courseGroup.courseId}>
                <h2 className="text-2xl font-bold font-headline mb-6 pb-2 border-b-2 border-primary/20 flex items-center gap-3">
                   <BookOpen className="h-6 w-6 text-primary" /> {courseGroup.courseTitle}
                </h2>
                <div className="space-y-8">
                    {courseGroup.modules.map(moduleGroup => (
                        <div key={moduleGroup.moduleId}>
                            <h3 className="text-base font-semibold text-muted-foreground flex items-center gap-2 mb-4">
                                <Layers className="h-4 w-4"/> Módulo: {moduleGroup.moduleTitle}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {moduleGroup.notes.map((note) => (
                                    <StickyNoteCard 
                                        key={note.id} 
                                        note={note} 
                                        onDelete={handleNoteDelete}
                                        onUpdate={handleNoteUpdate}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
