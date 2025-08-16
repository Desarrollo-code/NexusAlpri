// src/components/sticky-note-card.tsx
'use client';

import React from 'react';
import type { UserNote } from '@/types';
import Link from 'next/link';
import { Button } from './ui/button';
import { BookOpen, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  colorIndex: number;
}

const noteColors = [
  { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-200 dark:border-yellow-800/50', headerBg: 'bg-yellow-200/70 dark:bg-yellow-800/40', headerText: 'text-yellow-800 dark:text-yellow-200' },
  { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-200 dark:border-blue-800/50', headerBg: 'bg-blue-200/70 dark:bg-blue-800/40', headerText: 'text-blue-800 dark:text-blue-200' },
  { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-200 dark:border-green-800/50', headerBg: 'bg-green-200/70 dark:bg-green-800/40', headerText: 'text-green-800 dark:text-green-200' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-200 dark:border-pink-800/50', headerBg: 'bg-pink-200/70 dark:bg-pink-800/40', headerText: 'text-pink-800 dark:text-pink-200' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-200 dark:border-purple-800/50', headerBg: 'bg-purple-200/70 dark:bg-purple-800/40', headerText: 'text-purple-800 dark:text-purple-200' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-200 dark:border-indigo-800/50', headerBg: 'bg-indigo-200/70 dark:bg-indigo-800/40', headerText: 'text-indigo-800 dark:text-indigo-200' },
  { bg: 'bg-teal-100 dark:bg-teal-900/40', border: 'border-teal-200 dark:border-teal-800/50', headerBg: 'bg-teal-200/70 dark:bg-teal-800/40', headerText: 'text-teal-800 dark:text-teal-200' },
  { bg: 'bg-gray-100 dark:bg-gray-900/40', border: 'border-gray-200 dark:border-gray-700/50', headerBg: 'bg-gray-200/70 dark:bg-gray-800/40', headerText: 'text-gray-800 dark:text-gray-200' },
];

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({ note, colorIndex }) => {
  const color = noteColors[colorIndex % noteColors.length];

  return (
    <div
      className={cn(
        'rounded-lg border shadow-md flex flex-col h-64 transition-transform hover:-translate-y-1 hover:shadow-xl',
        color.bg,
        color.border
      )}
    >
      <div className={cn('p-3 rounded-t-lg', color.headerBg)}>
        <h4 className={cn('font-semibold text-sm truncate', color.headerText)}>
          {note.lesson.title}
        </h4>
      </div>
      <div className="p-3 flex-grow overflow-y-auto thin-scrollbar">
        <p className="text-sm whitespace-pre-wrap text-foreground/80">{note.content}</p>
      </div>
      <div className="p-2 border-t mt-auto flex justify-end">
        <Button asChild variant="link" size="sm" className="p-0 h-auto text-xs">
          <Link href={`/courses/${note.lesson.module.course.id}?lesson=${note.lesson.id}`}>
            Ir a la lección <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
