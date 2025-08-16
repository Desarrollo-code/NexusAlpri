
// src/app/(app)/my-notes/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Notebook, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { UserNote } from '@/types';
import { useTitle } from '@/contexts/title-context';

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

export default function MyNotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setPageTitle } = useTitle();

  const [notesByCourse, setNotesByCourse] = useState<Record<string, NoteWithRelations[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Mis Apuntes');
  }, [setPageTitle]);

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
      
      const groupedNotes = allNotes.reduce((acc, note) => {
        const courseTitle = note.lesson.module.course.title;
        if (!acc[courseTitle]) {
          acc[courseTitle] = [];
        }
        acc[courseTitle].push(note);
        return acc;
      }, {} as Record<string, NoteWithRelations[]>);

      setNotesByCourse(groupedNotes);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({ title: 'Error', description: 'No se pudieron cargar tus apuntes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-muted-foreground">Aquí encontrarás todos los apuntes que has tomado en los cursos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Apuntes por Curso</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p>Error al cargar: {error}</p>
            </div>
          ) : Object.keys(notesByCourse).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Notebook className="mx-auto h-12 w-12 mb-4 text-primary/70" />
              <h3 className="text-xl font-semibold text-foreground">Aún no tienes apuntes</h3>
              <p>Ve a una lección y comienza a escribir para que tus notas aparezcan aquí.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {Object.entries(notesByCourse).map(([courseTitle, notes]) => (
                <AccordionItem key={courseTitle} value={courseTitle} className="border rounded-lg bg-muted/20">
                  <AccordionTrigger className="p-4 font-semibold text-lg hover:no-underline">
                    {courseTitle}
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="space-y-3">
                        {notes.map(note => (
                            <div key={note.id} className="p-3 border rounded-md bg-background">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-primary">{note.lesson.title}</h4>
                                     <Button asChild variant="link" size="sm" className="p-0 h-auto">
                                        <Link href={`/courses/${note.lesson.module.course.id}`}>
                                           <BookOpen className="mr-2 h-4 w-4"/> Ir a la lección
                                        </Link>
                                     </Button>
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                            </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
