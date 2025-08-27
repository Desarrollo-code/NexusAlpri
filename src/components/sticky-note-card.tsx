// src/components/sticky-note-card.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { UserNote } from '@/types';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { ExternalLink, Layers, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichTextEditor } from './ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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

interface StickyNoteCardProps {
  note: NoteWithRelations;
  onDelete: (noteId: string) => void;
  onUpdate: (noteId: string, content: string) => void;
}

const noteColors = [
  { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-200 dark:border-yellow-800/50', text: 'text-yellow-900 dark:text-yellow-200' },
  { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-200 dark:border-blue-800/50', text: 'text-blue-900 dark:text-blue-200' },
  { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-200 dark:border-green-800/50', text: 'text-green-900 dark:text-green-200' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-200 dark:border-pink-800/50', text: 'text-pink-900 dark:text-pink-200' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-900 dark:text-purple-200' },
];

const getUniqueColorIndex = (id: string) => {
    return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % noteColors.length;
}

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({ note, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const colorIndex = getUniqueColorIndex(note.id);
  const color = noteColors[colorIndex];

  useEffect(() => {
      setEditedContent(note.content);
  }, [note.content]);

  const handleSave = async () => {
      if (editedContent === note.content) {
          setIsEditing(false);
          return;
      }
      setIsSaving(true);
      try {
          const response = await fetch('/api/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lessonId: note.lessonId, content: editedContent }),
          });
          if (!response.ok) throw new Error("No se pudo guardar la nota.");
          
          onUpdate(note.id, editedContent);
          setIsEditing(false);
          toast({ title: "Nota actualizada" });
      } catch (error) {
          toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
      } finally {
          setIsSaving(false);
      }
  };

  const handleDelete = () => {
    onDelete(note.id);
    setShowDeleteConfirm(false);
  };
  

  return (
    <>
    <div
      className={cn(
        'rounded-lg border shadow-lg flex flex-col h-72 transition-transform duration-300',
        isEditing ? 'scale-105 shadow-2xl z-10' : 'hover:-translate-y-2 hover:rotate-[-2deg] hover:shadow-2xl',
        color.bg,
        color.border
      )}
    >
      <div className={cn('p-3 rounded-t-lg space-y-1 border-b', color.border)}>
        <h4 className={cn('font-bold text-base truncate', color.text)}>
          {note.lesson.title}
        </h4>
        <p className={cn('text-xs font-medium flex items-center gap-1.5', color.text, 'opacity-80')}>
            <Layers className="h-3 w-3"/>
            {note.lesson.module.title}
        </p>
      </div>
      <div className="p-2 flex-grow overflow-y-auto thin-scrollbar">
         {isEditing ? (
            <RichTextEditor value={editedContent} onChange={setEditedContent} disabled={isSaving} className="h-full bg-background/50"/>
         ) : (
             <div className="text-base leading-snug whitespace-pre-wrap text-foreground/90 font-body p-2" dangerouslySetInnerHTML={{ __html: note.content }} />
         )}
      </div>
       <div className="p-2 border-t mt-auto flex justify-between items-center bg-black/5 rounded-b-lg">
           <div className="flex items-center gap-1">
             {isEditing ? (
                 <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs">
                     {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <Save className="mr-1 h-3 w-3"/>} Guardar
                 </Button>
             ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 text-xs">
                    <Edit className="mr-1 h-3 w-3"/> Editar
                </Button>
             )}
             <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={isEditing} className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                 <Trash2 className="mr-1 h-3 w-3"/> Eliminar
             </Button>
           </div>
           <Button asChild variant="link" size="sm" className="p-0 h-auto text-xs">
                <Link href={`/courses/${note.lesson.module.course.id}?lesson=${note.lesson.id}`}>
                    Ir a lección <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
            </Button>
      </div>
    </div>
    
     <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción eliminará tu apunte para la lección "<strong>{note.lesson.title}</strong>" permanentemente. No se puede deshacer.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
