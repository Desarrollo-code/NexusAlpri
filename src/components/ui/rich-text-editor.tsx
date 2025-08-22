// src/components/ui/rich-text-editor.tsx
'use client';

import React from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Image, Quote, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './separator';
import { Button } from './button';
import { Textarea } from './textarea';

interface RichTextEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // We can add more props here in the future for a real implementation
}

const EditorToolbar = () => (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/50 rounded-t-lg">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Negrita (Próximamente)"><Bold className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Cursiva (Próximamente)"><Italic className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Subrayado (Próximamente)"><Underline className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Tachado (Próximamente)"><Strikethrough className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Lista con Viñetas (Próximamente)"><List className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Lista Numerada (Próximamente)"><ListOrdered className="h-4 w-4" /></Button>
         <Separator orientation="vertical" className="h-6 mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Citar (Próximamente)"><Quote className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Código (Próximamente)"><Code className="h-4 w-4" /></Button>
    </div>
);


export const RichTextEditor = React.forwardRef<HTMLTextAreaElement, RichTextEditorProps>(
  ({ className, ...props }, ref) => {
    return (
        <div className="w-full rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring">
            <EditorToolbar />
            <Textarea
                ref={ref}
                className={cn(
                    "w-full min-h-[150px] rounded-t-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 text-base",
                    className
                )}
                {...props}
            />
        </div>
    );
  }
);
RichTextEditor.displayName = 'RichTextEditor';
