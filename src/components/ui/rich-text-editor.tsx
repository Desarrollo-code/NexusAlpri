'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactQuillProps } from 'react-quill-new';

// Importa react-quill-new de forma dinámica para evitar SSR.
const ReactQuill = dynamic(
  () => import('react-quill-new'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-40 border rounded-md bg-muted/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
  }
);

interface RichTextEditorProps extends ReactQuillProps {}

// Configuración de la toolbar
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link',
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-card text-foreground rounded-md border',
        'quill-editor',
        className,
      )}
    >
      <ReactQuill
        theme="snow"
        modules={modules}
        formats={formats}
        {...props}
      />
    </div>
  );
};
