// src/components/forms/form-editor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Save, Loader2, FilePen, GripVertical, Trash2, List, CaseSensitive, CheckSquare, ListChecks, Pilcrow, MessageSquare, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Form, FormField, FormFieldType } from '@prisma/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '../ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';

type FullForm = Form & { fields: FormField[] };
let tempIdCounter = 0;
const generateTempId = (prefix: string) => `${prefix}-${Date.now()}-${tempIdCounter++}`;

interface FormOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

const FieldEditor = ({ field, onUpdate, onDelete, isSaving, provided }: { field: FormField; onUpdate: (id: string, updates: Partial<FormField>) => void; onDelete: (id: string) => void; isSaving: boolean; provided: any }) => {
    
    const options = (Array.isArray(field.options) ? field.options : []) as FormOption[];

    const handleAddOption = () => {
        const newOption: FormOption = {
            id: generateTempId('opt'),
            text: `Opción ${options.length + 1}`,
            isCorrect: false,
        };
        onUpdate(field.id, { options: [...options, newOption] });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        onUpdate(field.id, { options: newOptions });
    };
    
    const handleCorrectChange = (optionId: string, isSingleChoice: boolean) => {
        let newOptions = [...options];
        if (isSingleChoice) {
            newOptions = newOptions.map((opt) => ({ ...opt, isCorrect: opt.id === optionId }));
        } else {
            newOptions = newOptions.map((opt) => opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt);
        }
        onUpdate(field.id, { options: newOptions });
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = options.filter((_, i) => i !== index);
        onUpdate(field.id, { options: newOptions });
    };

    const renderOptionsEditor = () => {
        if (field.type !== 'SINGLE_CHOICE' && field.type !== 'MULTIPLE_CHOICE') return null;

        const isSingleChoice = field.type === 'SINGLE_CHOICE';
        
        return (
            <div className="space-y-2 mt-2 pl-6">
                <RadioGroup 
                    value={isSingleChoice ? options.find(o => o.isCorrect)?.id : undefined} 
                    onValueChange={(val) => isSingleChoice && handleCorrectChange(val, true)}
                >
                    {(options).map((option, index) => {
                         const optionId = `opt-${field.id}-${option.id}`;
                         return (
                            <div key={option.id} className="flex items-center gap-2">
                                {isSingleChoice ? (
                                    <RadioGroupItem value={option.id} id={optionId} />
                                ) : (
                                    <Checkbox
                                        id={optionId}
                                        checked={option.isCorrect}
                                        onCheckedChange={() => handleCorrectChange(option.id, false)}
                                    />
                                )}
                                <Label htmlFor={optionId} className="flex-grow font-normal">
                                    <Input value={option.text} onChange={e => handleOptionChange(index, e.target.value)} placeholder={`Opción ${index + 1}`} disabled={isSaving}/>
                                </Label>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveOption(index)} disabled={isSaving || options.length <= 1}><X className="h-4 w-4"/></Button>
                            </div>
                         )
                    })}
                </RadioGroup>
                <Button variant="link" size="sm" onClick={handleAddOption} disabled={isSaving}>+ Añadir opción</Button>
            </div>
        )
    };

    return (
        <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-start gap-2 bg-muted/50 p-4 rounded-lg border">
            <div {...provided.dragHandleProps} className="pt-2 cursor-grab">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-grow space-y-2">
                <div className="flex items-center gap-2">
                     <Input 
                        placeholder="Escribe tu pregunta" 
                        value={field.label}
                        onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                        className="text-base flex-grow"
                        disabled={isSaving}
                    />
                    <Select value={field.type} onValueChange={(v) => onUpdate(field.id, { type: v as FormFieldType})}>
                        <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SHORT_TEXT">Respuesta Corta</SelectItem>
                            <SelectItem value="LONG_TEXT">Párrafo</SelectItem>
                            <SelectItem value="SINGLE_CHOICE">Opción Múltiple</SelectItem>
                            <SelectItem value="MULTIPLE_CHOICE">Casillas de Verificación</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <Input 
                    placeholder="Texto de ayuda o placeholder (opcional)" 
                    value={field.placeholder || ''}
                    onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                    className="text-sm"
                    disabled={isSaving}
                />
                {renderOptionsEditor()}
                <div className="flex items-center justify-end gap-4 pt-2">
                    <div className="flex items-center gap-2">
                       <Label htmlFor={`required-${field.id}`} className="text-sm">Obligatorio</Label>
                       <Switch id={`required-${field.id}`} checked={field.required} onCheckedChange={(c) => onUpdate(field.id, { required: c })} />
                    </div>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(field.id)} disabled={isSaving}><Trash2 className="h-4 w-4" /></Button>
                </div>
            </div>
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
    
    const updateFormFieldData = (field: keyof FullForm, value: any) => {
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
            options: type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' ? [{ id: generateTempId('opt'), text: 'Opción 1', isCorrect: true }] : [],
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
        
        updateFormFieldData('fields', items);
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
                                    onChange={(e) => updateFormFieldData('title', e.target.value)}
                                    className="text-2xl font-bold h-auto p-2 border-0 shadow-none focus-visible:ring-1"
                                    placeholder="Título del Formulario"
                                />
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="form-description" className="sr-only">Descripción</Label>
                                <Textarea 
                                    id="form-description"
                                    value={form.description || ''}
                                    onChange={(e) => updateFormFieldData('description', e.target.value)}
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
                     {form.fields.length === 0 && (
                        <div className="text-center border-2 border-dashed rounded-lg p-12">
                            <h3 className="text-lg font-semibold">Formulario Vacío</h3>
                            <p className="text-muted-foreground mt-1">Añade tu primera pregunta desde la caja de herramientas.</p>
                        </div>
                     )}
                </div>
                <aside className="lg:col-span-1 lg:sticky top-24">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FilePen className="h-5 w-5 text-primary"/> Caja de Herramientas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="w-full justify-start" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Añadir Pregunta</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onSelect={() => addField('SHORT_TEXT')}><CaseSensitive className="mr-2 h-4 w-4"/>Respuesta Corta</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => addField('LONG_TEXT')}><Pilcrow className="mr-2 h-4 w-4"/>Párrafo</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => addField('SINGLE_CHOICE')}><ListChecks className="mr-2 h-4 w-4"/>Opción Múltiple</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => addField('MULTIPLE_CHOICE')}><CheckSquare className="mr-2 h-4 w-4"/>Casillas de Verificación</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardContent>
                     </Card>
                </aside>
            </div>
        </div>
    );
}
