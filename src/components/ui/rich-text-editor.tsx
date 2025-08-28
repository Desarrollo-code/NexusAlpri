
'use client';

import React, { useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactQuillProps } from 'react-quill';

// Quill no es compatible con SSR, por lo que lo cargamos dinámicamente solo en el cliente.
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    
    // Este es el truco: se crea un componente que reenvía la referencia.
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


interface RichTextEditorProps extends ReactQuillProps {
  // Aquí podemos añadir props personalizadas en el futuro si es necesario
}

const modulesConfig = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean']
  ],
  clipboard: {
    // Coincidir con cualquier etiqueta de estilo para limpiar el pegado
    matchVisual: false,
  }
};

const formatsConfig = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    className,
    value,
    onChange,
    ...props
}) => {
  const quillRef = useRef(null);

  // Usamos useMemo para la configuración para evitar re-renderizados innecesarios.
  const modules = useMemo(() => (modulesConfig), []);
  const formats = useMemo(() => (formatsConfig), []);

  return (
    <div className={cn("bg-card text-foreground rounded-md border", className, "quill-editor")}>
        <ReactQuill
            forwardedRef={quillRef}
            theme="snow"
            modules={modules}
            formats={formats}
            value={value}
            onChange={onChange}
            {...props}
        />
    </div>
  );
};
