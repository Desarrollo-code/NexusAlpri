// src/components/ui/rich-text-editor.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import 'react-quill/dist/quill.snow.css'; // Importa los estilos del editor
import { cn } from '@/lib/utils';
import type { ReactQuillProps } from 'react-quill';

// Carga dinámica de ReactQuill para que solo se renderice en el cliente
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill');
        // Este es el truco: se crea un componente que reenvía la referencia.
        // eslint-disable-next-line react/display-name
        return ({ forwardedRef, ...props }: { forwardedRef: React.Ref<any> } & ReactQuillProps) => <RQ ref={forwardedRef} {...props} />;
    },
    { 
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-40 border rounded-md bg-muted/50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )
    }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],        // Estilos básicos
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['blockquote', 'code-block'],                     // Cita y bloque de código
    ['link'],                                          // Enlace
    ['clean']                                         // Limpiar formato
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
    className 
}) => {
    const editorRef = React.useRef(null);
    return (
        <div className={cn("bg-card text-foreground rounded-md border", className)}>
             <ReactQuill 
                forwardedRef={editorRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                readOnly={disabled}
                className="quill-editor" // Clase para estilos personalizados si es necesario
            />
        </div>
    );
};