// src/components/ui/rich-text-editor.tsx
'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactQuillProps } from 'react-quill';

// Solución al error 'findDOMNode'.
// 1. Creamos un componente que reenvía la referencia.
// 2. Este componente se importa dinámicamente sin SSR.
const QuillWrapper = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    // eslint-disable-next-line react/display-name
    return ({ forwardedRef, ...props }: { forwardedRef: React.Ref<any> } & ReactQuillProps) => {
      return <RQ ref={forwardedRef} {...props} />;
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-40 border rounded-md bg-muted/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
  }
);


interface RichTextEditorProps extends Omit<ReactQuillProps, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    value, 
    onChange, 
    placeholder, 
    disabled, 
    className,
    ...props
}) => {
  const editorRef = useRef(null);

  return (
    <div className={cn("bg-card text-foreground rounded-md border", className)}>
        <QuillWrapper
            forwardedRef={editorRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={disabled}
            className="quill-editor" // Clase para estilos personalizados
            {...props}
        />
    </div>
  );
};
