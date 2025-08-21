// src/components/sticky-note-card.tsx
'use client';

import React from 'react';
import type { UserNote } from '@/types';
import Link from 'next/link';
import { Button } from './ui/button';
import { ExternalLink, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import localFont from 'next/font/local';

const handwritingFont = localFont({ src: '../../public/fonts/Caveat-Regular.ttf' });

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

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({ note }) => {
  const colorIndex = getUniqueColorIndex(note.id);
  const color = noteColors[colorIndex];

  return (
    <div
      className={cn(
        'rounded-lg border shadow-lg flex flex-col h-72 transition-transform duration-300 hover:-translate-y-2 hover:rotate-[-2deg] hover:shadow-2xl',
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
      <div className={cn("p-4 flex-grow overflow-y-auto thin-scrollbar", handwritingFont.className)}>
        <p className="text-lg leading-snug whitespace-pre-wrap text-foreground/90">{note.content}</p>
      </div>
      <div className="p-2 border-t mt-auto flex justify-end bg-black/5 rounded-b-lg">
        <Button asChild variant="link" size="sm" className="p-0 h-auto text-xs">
          <Link href={`/courses/${note.lesson.module.course.id}?lesson=${note.lesson.id}`}>
            Ir a la lección <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
