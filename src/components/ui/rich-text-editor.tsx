'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import type { ReactQuillProps } from 'react-quill-new';
import { ColorfulLoader } from './colorful-loader';

// Importa react-quill-new de forma dinámica para evitar SSR.
const ReactQuill = dynamic(
  () => import('react-quill-new'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-40 border rounded-md bg-muted/50">
        <div className="w-6 h-6"><ColorfulLoader /></div>
      </div>
    ),
  }
);

interface RichTextEditorProps extends ReactQuillProps {
  variant?: 'default' | 'mini';
  value?: string;
  onChange?: (value: string) => void;
}

// Configuración de las barras de herramientas
const defaultToolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link'],
  ['clean'],
];

const miniToolbar = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
];

// Formatos permitidos
const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'blockquote', 'code-block',
  'link',
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const modules = {
    toolbar: variant === 'mini' ? miniToolbar : defaultToolbar,
  };

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
