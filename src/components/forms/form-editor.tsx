// src/components/forms/form-editor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Save, Loader2, FilePen, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Form, FormField, FormFieldType } from '@prisma/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

type FullForm = Form & { fields: FormField[] };
let tempIdCounter = 0;
const generateTempId = (prefix: string) => `${prefix}-${Date.now()}-${tempIdCounter++}`;

const FieldEditor = ({ field, onUpdate, onDelete, isSaving, provided }: { field: FormField; onUpdate: (id: string, updates: Partial<FormField>) => void; onDelete: (id: string) => void; isSaving: boolean; provided: any }) => {
    return (
        <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-start gap-2 bg-muted/50 p-4 rounded-lg border">
            <div {...provided.dragHandleProps} className="pt-2 cursor-grab">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-grow space-y-2">
                <Input 
                    placeholder="Escribe tu pregunta" 
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    className="text-base"
                    disabled={isSaving}
                />
                {field.type === 'SHORT_TEXT' && (
                    <Input placeholder="Texto de respuesta corta" disabled />
                )}
            </div>
             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(field.id)} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
        </div>
    );
};


export function FormEditor({ formId }: { formId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();

    const [form, setForm] = useState<FullForm | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const fetchForm = async () => {
            if (formId === 'new') {
                // This case should ideally be handled by creating a draft first and then redirecting
                toast({ title: "Error", description: "Formulario no válido.", variant: "destructive"});
                router.push('/forms');
                return;
            }
            setIsLoading(true);
            try {
                const res = await fetch(`/api/forms/${formId}`);
                if (!res.ok) throw new Error((await res.json()).message || "No se pudo cargar el formulario.");
                const data: FullForm = await res.json();
                setForm(data);
                setPageTitle(`Editando: ${data.title}`);
            } catch (err) {
                toast({ title: "Error", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
                router.push('/forms');
            } finally {
                setIsLoading(false);
            }
        };
        fetchForm();
    }, [formId, router, toast, setPageTitle]);
    
    const updateFormField = (field: keyof FullForm, value: any) => {
        setForm(prev => prev ? { ...prev, [field]: value } : null);
        setIsDirty(true);
    }
    
    const updateField = (id: string, updates: Partial<FormField>) => {
        setForm(prev => {
            if (!prev) return null;
            const newFields = prev.fields.map(f => f.id === id ? { ...f, ...updates } : f);
            return { ...prev, fields: newFields };
        });
        setIsDirty(true);
    };

    const addField = (type: FormFieldType) => {
        const newField: FormField = {
            id: generateTempId('field'),
            formId: formId,
            label: 'Nueva Pregunta',
            type: type,
            required: false,
            placeholder: null,
            options: [],
            order: form?.fields.length || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setForm(prev => prev ? { ...prev, fields: [...prev.fields, newField] } : null);
        setIsDirty(true);
    };
    
    const deleteField = (id: string) => {
        setForm(prev => {
            if (!prev) return null;
            return { ...prev, fields: prev.fields.filter(f => f.id !== id) };
        });
        setIsDirty(true);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !form) return;
        const items = Array.from(form.fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        updateFormField('fields', items);
    };
    
    const handleSaveChanges = async () => {
        if (!form) return;
        setIsSaving(true);

        const payload = { 
            ...form,
            fields: form.fields.map((field, index) => ({ ...field, order: index })),
        };

        try {
            const res = await fetch(`/api/forms/${formId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudo guardar el formulario');
            const savedForm: FullForm = await res.json();
            setForm(savedForm);
            setIsDirty(false);
            toast({ title: "¡Guardado!", description: "Los cambios en tu formulario han sido guardados." });
        } catch (err) {
            toast({ title: 'Error al Guardar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!form) {
        return <div className="text-center py-10">No se pudo cargar el formulario.</div>;
    }

    return (
        <div className="space-y-6 pb-24">
            <header className="flex items-center justify-between gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/forms')}><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Formularios</Button>
                <div className="flex items-center gap-2">
                    <Button onClick={handleSaveChanges} disabled={!isDirty || isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                        Guardar Cambios
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                           <div className="space-y-1">
                                <Label htmlFor="form-title" className="sr-only">Título</Label>
                                <Input 
                                    id="form-title"
                                    value={form.title}
                                    onChange={(e) => updateFormField('title', e.target.value)}
                                    className="text-2xl font-bold h-auto p-2 border-0 shadow-none focus-visible:ring-1"
                                    placeholder="Título del Formulario"
                                />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="form-description" className="sr-only">Descripción</Label>
                                <Textarea 
                                    id="form-description"
                                    value={form.description || ''}
                                    onChange={(e) => updateFormField('description', e.target.value)}
                                    className="text-base border-0 shadow-none focus-visible:ring-1"
                                    placeholder="Añade una descripción para tu formulario (opcional)"
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="form-fields">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                    {form.fields.map((field, index) => (
                                         <Draggable key={field.id} draggableId={field.id} index={index}>
                                            {(provided) => (
                                                <FieldEditor 
                                                    field={field} 
                                                    onUpdate={updateField} 
                                                    onDelete={deleteField}
                                                    isSaving={isSaving}
                                                    provided={provided}
                                                />
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
                <aside className="lg:col-span-1 lg:sticky top-24">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FilePen className="h-5 w-5 text-primary"/> Caja de Herramientas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Button className="w-full justify-start" variant="ghost" onClick={() => addField('SHORT_TEXT')}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Respuesta Corta
                            </Button>
                             <p className="text-xs text-muted-foreground text-center pt-2">Más tipos de pregunta próximamente...</p>
                        </CardContent>
                     </Card>
                </aside>
            </div>
        </div>
    );
}