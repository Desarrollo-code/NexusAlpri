// src/components/forms/form-editor.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Save, PlusCircle, Trash2, GripVertical, Check, Eye, BarChart, Share2, FilePen, MoreVertical, Settings, Copy, Shield, X, CheckSquare, ChevronDown, Type, CaseUpper, MessageSquare, ListChecks } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { AppForm, FormField, FormFieldType, FormStatus } from '@/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const generateUniqueId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Componente para editar un campo individual
const FieldEditor = ({ field, isScoringEnabled, onUpdate, onDelete, onOptionChange, onOptionAdd, onOptionDelete, onCorrectChange, isSaving }: { 
    field: FormField,
    isScoringEnabled: boolean,
    onUpdate: (id: string, updates: Partial<FormField>) => void, 
    onDelete: (id: string) => void,
    onOptionChange: (fieldId: string, optionIndex: number, updates: Partial<{text: string; points: number}>) => void,
    onOptionAdd: (fieldId: string) => void,
    onOptionDelete: (fieldId: string, optionIndex: number) => void,
    onCorrectChange: (fieldId: string, optionId: string, isCorrect: boolean) => void,
    isSaving: boolean 
}) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onUpdate(field.id, { [e.target.name]: e.target.value });
    };

    const handleSwitchChange = (checked: boolean, name: string) => {
        onUpdate(field.id, { [name]: checked });
    };
    
   const renderOptionsEditor = () => {
    const options = (field.options || []) as { id: string, text: string, isCorrect: boolean, points?: number }[];

    const handlePointsChange = (optionIndex: number, value: string) => {
        const points = parseInt(value, 10);
        onOptionChange(field.id, optionIndex, { points: isNaN(points) ? 0 : points });
    };

    const renderOption = (option: typeof options[0], index: number) => {
        const optionId = `opt-${field.id}-${option.id}`;
        return (
            <div className="flex items-center gap-2" key={option.id}>
                {field.type === 'SINGLE_CHOICE' ? (
                    <RadioGroupItem value={option.id} id={optionId} />
                ) : (
                    <Checkbox id={optionId} checked={option.isCorrect} onCheckedChange={(checked) => onCorrectChange(field.id, option.id, !!checked)} />
                )}
                <Label htmlFor={optionId} className="flex-grow font-normal">
                    <Input 
                        value={option.text} 
                        onChange={e => onOptionChange(field.id, index, { text: e.target.value })} 
                        placeholder={`Opción ${index + 1}`} 
                        disabled={isSaving}
                    />
                </Label>
                {isScoringEnabled && (
                    <Input
                        type="number"
                        value={option.points || 0}
                        onChange={(e) => handlePointsChange(index, e.target.value)}
                        className="w-20 h-9"
                        disabled={isSaving}
                    />
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={(e) => { e.preventDefault(); onOptionDelete(field.id, index)}} disabled={isSaving}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    if (field.type === 'SINGLE_CHOICE') {
        return (
            <RadioGroup 
                className="space-y-2 mt-2 pl-6" 
                onValueChange={(val) => onCorrectChange(field.id, val, true)} 
                value={options.find(opt => opt.isCorrect)?.id}
            >
                {options.map(renderOption)}
                <Button variant="link" size="sm" type="button" onClick={() => onOptionAdd(field.id)} className="ml-0 p-0 h-auto">
                    + Añadir opción
                </Button>
            </RadioGroup>
        );
    }
    
    if (field.type === 'MULTIPLE_CHOICE') {
        return (
            <div className="space-y-2 mt-2 pl-6">
                {options.map(renderOption)}
                <Button variant="link" size="sm" type="button" onClick={() => onOptionAdd(field.id)} className="p-0 h-auto">
                    + Añadir opción
                </Button>
            </div>
        );
    }

    return null;
};


    return (
      <Card className="bg-muted/30 p-4 border relative">
          <div className="flex items-center gap-2 mb-4">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              <div className="flex-grow space-y-2">
                  <Input 
                      name="label"
                      value={field.label}
                      onChange={handleInputChange}
                      placeholder="Escribe tu pregunta aquí..."
                      className="text-base font-semibold border-transparent focus:border-input"
                      disabled={isSaving}
                  />
                  <Input 
                      name="placeholder"
                      value={field.placeholder ?? ''}
                      onChange={handleInputChange}
                      placeholder="Texto de ejemplo o ayuda (opcional)"
                      className="text-xs h-8"
                      disabled={isSaving}
                  />
              </div>
               <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => onDelete(field.id)} disabled={isSaving}>
                  <Trash2 className="h-4 w-4" />
              </Button>
          </div>
          
          {renderOptionsEditor()}

          <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2">
                  <Switch id={`required-${field.id}`} checked={field.required} onCheckedChange={(c) => handleSwitchChange(c, 'required')} disabled={isSaving}/>
                  <Label htmlFor={`required-${field.id}`}>Requerido</Label>
              </div>
               <Select value={field.type} onValueChange={(type) => onUpdate(field.id, { type: type as FormFieldType, options: type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' ? field.options : [] })}>
                  <SelectTrigger className="w-[180px] h-9">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="SHORT_TEXT">Texto Corto</SelectItem>
                      <SelectItem value="LONG_TEXT">Párrafo</SelectItem>
                      <SelectItem value="SINGLE_CHOICE">Opción Única</SelectItem>
                      <SelectItem value="MULTIPLE_CHOICE">Casillas</SelectItem>
                  </SelectContent>
              </Select>
          </div>
      </Card>
    );
};


// Componente principal del editor de formularios
export function FormEditor({ formId }: { formId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();

    const [form, setForm] = useState<AppForm | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    const handleFormUpdate = (updates: Partial<AppForm>) => {
        setForm(prev => prev ? { ...prev, ...updates } : null);
        setIsDirty(true);
    };

    const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
       handleFormUpdate({
           fields: form!.fields.map(f => f.id === fieldId ? {...f, ...updates} : f)
       });
    };

    const addField = (type: FormFieldType) => {
        const newField: FormField = {
            id: generateUniqueId('field'),
            label: `Nueva Pregunta (${type.replace('_', ' ')})`,
            type,
            required: false,
            options: type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' ? [{id: generateUniqueId('opt'), text: 'Opción 1', isCorrect: false, points: 0}] : [],
            placeholder: '',
            order: form ? form.fields.length : 0,
            formId: formId,
        };
        handleFormUpdate({ fields: [...(form?.fields || []), newField] });
    };

    const deleteField = (id: string) => {
        handleFormUpdate({ fields: form!.fields.filter(f => f.id !== id) });
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || !form) return;
        const items = Array.from(form.fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        handleFormUpdate({ fields: items });
    };
    
    // --- Edición de opciones ---
    const handleOptionAdd = (fieldId: string) => {
        const newOption = { id: generateUniqueId('opt'), text: 'Nueva Opción', isCorrect: false, points: 0 };
        const updatedFields = form!.fields.map(f => {
            if (f.id === fieldId) {
                return { ...f, options: [...(f.options as any[]), newOption] };
            }
            return f;
        });
        handleFormUpdate({ fields: updatedFields });
    };

    const handleOptionChange = (fieldId: string, optionIndex: number, updates: Partial<{text: string, points: number}>) => {
        const updatedFields = form!.fields.map(f => {
            if (f.id === fieldId) {
                const newOptions = [...(f.options as any[])];
                newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
                return { ...f, options: newOptions };
            }
            return f;
        });
        handleFormUpdate({ fields: updatedFields });
    };
    
      const handleCorrectChange = (fieldId: string, optionId: string, isCorrect: boolean) => {
        const updatedFields = form!.fields.map(f => {
            if (f.id === fieldId) {
                const newOptions = (f.options as any[]).map(opt => {
                    if (f.type === 'SINGLE_CHOICE') {
                        return { ...opt, isCorrect: opt.id === optionId };
                    }
                    if (opt.id === optionId) {
                        return { ...opt, isCorrect: isCorrect };
                    }
                    return opt;
                });
                return { ...f, options: newOptions };
            }
            return f;
        });
        handleFormUpdate({ fields: updatedFields });
    };


    const handleOptionDelete = (fieldId: string, optionIndex: number) => {
        const updatedFields = form!.fields.map(f => {
            if (f.id === fieldId) {
                 const newOptions = (f.options as any[]).filter((_, i) => i !== optionIndex);
                 return { ...f, options: newOptions };
            }
            return f;
        });
        handleFormUpdate({ fields: updatedFields });
    };
    
    const handleSaveChanges = async () => {
        if (!form) return;
        setIsSaving(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                status: form.status,
                isQuiz: form.isQuiz,
                fields: form.fields.map((f, index) => ({...f, order: index}))
            };
            const res = await fetch(`/api/forms/${formId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.json()).message || 'No se pudo guardar el formulario.');
            
            const updatedForm = await res.json();
            setForm(updatedForm);
            setIsDirty(false);
            toast({ title: '¡Guardado!', description: 'Tus cambios en el formulario han sido guardados.' });
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };


    useEffect(() => {
        const fetchForm = async () => {
            if (!formId) return;
            setIsLoading(true);
            try {
                const res = await fetch(`/api/forms/${formId}`);
                if (!res.ok) throw new Error('No se pudo cargar el formulario o no tienes permiso.');
                const data = await res.json();
                setForm(data);
                setPageTitle(`Editando: ${data.title}`);
            } catch (err) {
                toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
                router.push('/forms');
            } finally {
                setIsLoading(false);
            }
        };
        fetchForm();
    }, [formId, router, toast, setPageTitle]);

    if (isLoading || !form) {
        return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div className="flex-grow space-y-1">
                     <Input value={form.title} onChange={e => handleFormUpdate({ title: e.target.value })} className="text-2xl font-bold h-auto p-0 border-none focus-visible:ring-0 bg-transparent" />
                     <Textarea value={form.description ?? ''} onChange={e => handleFormUpdate({ description: e.target.value })} placeholder="Añade una descripción para tu formulario..." className="text-muted-foreground border-none p-0 focus-visible:ring-0 h-auto resize-none bg-transparent"/>
                 </div>
                 <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                     <Link href={`/forms/${formId}/results`} className={cn(buttonVariants({variant: 'outline'}))}>
                         <BarChart className="mr-2 h-4 w-4"/>Resultados
                     </Link>
                     <Link href={`/forms/${formId}/view`} target="_blank" className={cn(buttonVariants({variant: 'outline'}))}>
                        <Eye className="mr-2 h-4 w-4"/>Vista Previa
                     </Link>
                     <Button onClick={handleSaveChanges} disabled={isSaving || !isDirty}>
                         {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                         Guardar
                     </Button>
                 </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <main className="lg:col-span-2 space-y-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="form-fields">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                    {form.fields.map((field, index) => (
                                         <Draggable key={field.id} draggableId={field.id} index={index}>
                                             {(provided) => (
                                                 <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                     <FieldEditor 
                                                         field={field} 
                                                         isScoringEnabled={!!form.isQuiz}
                                                         onUpdate={handleFieldUpdate} 
                                                         onDelete={deleteField}
                                                         onOptionChange={handleOptionChange}
                                                         onOptionAdd={handleOptionAdd}
                                                         onOptionDelete={handleOptionDelete}
                                                         onCorrectChange={handleCorrectChange}
                                                         isSaving={isSaving}
                                                     />
                                                 </div>
                                              )}
                                         </Draggable>
                                     ))}
                                     {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </main>
                <aside className="lg:sticky lg:top-24 space-y-4">
                     <Card>
                         <CardHeader>
                            <CardTitle className="text-base">Añadir Campo</CardTitle>
                         </CardHeader>
                         <CardContent className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => addField('SHORT_TEXT')}><Type className="h-5 w-5 mb-1"/>Texto Corto</Button>
                            <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => addField('LONG_TEXT')}><MessageSquare className="h-5 w-5 mb-1"/>Párrafo</Button>
                            <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => addField('SINGLE_CHOICE')}><ListChecks className="h-5 w-5 mb-1"/>Opción Única</Button>
                            <Button variant="outline" size="sm" className="h-auto py-2 flex flex-col gap-1" onClick={() => addField('MULTIPLE_CHOICE')}><CheckSquare className="h-5 w-5 mb-1"/>Casillas</Button>
                         </CardContent>
                     </Card>
                      <Card>
                         <CardHeader><CardTitle className="text-base">Configuración</CardTitle></CardHeader>
                         <CardContent>
                           <Tabs defaultValue="properties">
                             <TabsList className="grid w-full grid-cols-2">
                               <TabsTrigger value="properties">Propiedades</TabsTrigger>
                               <TabsTrigger value="share">Compartir</TabsTrigger>
                             </TabsList>
                             <TabsContent value="properties" className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="isQuiz" className="font-semibold">Habilitar Puntuación</Label>
                                        <Switch id="isQuiz" checked={!!form.isQuiz} onCheckedChange={(c) => handleFormUpdate({ isQuiz: c })} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Convierte este formulario en una evaluación con puntos por respuesta.</p>
                                </div>
                                <div className="space-y-2">
                                     <Label>Estado del Formulario</Label>
                                     <Select value={form.status} onValueChange={(s) => handleFormUpdate({ status: s as FormStatus })}>
                                         <SelectTrigger><SelectValue/></SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="DRAFT">Borrador</SelectItem>
                                             <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                             <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                         </SelectContent>
                                     </Select>
                                </div>
                             </TabsContent>
                             <TabsContent value="share" className="mt-4">
                               {form.status === 'PUBLISHED' && (
                                 <div className="space-y-2">
                                     <Label>Enlace para Compartir</Label>
                                     <div className="flex items-center gap-2">
                                       <Input readOnly value={`${window.location.origin}/forms/${formId}/view`} />
                                       <Button size="icon" variant="ghost" onClick={() => {
                                           navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}/view`);
                                           toast({title: 'Copiado', description: 'El enlace ha sido copiado al portapapeles.'});
                                         }}><Copy className="h-4 w-4"/></Button>
                                     </div>
                                 </div>
                                )}
                                {form.status !== 'PUBLISHED' && (
                                    <p className="text-sm text-center text-muted-foreground p-4 bg-muted rounded-md">Publica el formulario para obtener el enlace para compartir.</p>
                                )}
                             </TabsContent>
                           </Tabs>
                         </CardContent>
                      </Card>
                </aside>
            </div>
        </div>
    );
}
