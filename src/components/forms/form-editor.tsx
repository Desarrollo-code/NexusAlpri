// src/components/forms/form-editor.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Save, PlusCircle, Trash2, GripVertical, Check, Eye, BarChart, Share2, FilePen, MoreVertical, Settings, Copy, Shield, X, CheckSquare, ChevronDown, Type, CaseUpper, MessageSquare, ListChecks, Info } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { AppForm, FormField, FormFieldOption, FormFieldType, FormStatus } from '@/types';
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
import { Alert, AlertDescription } from '../ui/alert';

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
    const options = (field.options || []) as FormFieldOption[];

    const handlePointsChange = (optionIndex: number, value: string) => {
        const points = parseInt(value, 10);
        onOptionChange(field.id, optionIndex, { points: isNaN(points) ? 0 : points });
    };

    const renderOption = (option: FormFieldOption, index: number) => {
        const optionId = `opt-${field.id}-${option.id}`;
        // La puntuación solo se muestra para opción única
        const showScoring = isScoringEnabled && field.type === 'SINGLE_CHOICE';

        return (
            <div key={option.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-md border">
                {field.type === 'SINGLE_CHOICE' ? (
                    <RadioGroupItem value={option.id} id={optionId} checked={option.isCorrect} onClick={() => onCorrectChange(field.id, option.id, true)} />
                ) : (
                    <Checkbox id={optionId} checked={option.isCorrect} onCheckedChange={(checked) => onCorrectChange(field.id, option.id, !!checked)} />
                )}
                <Label htmlFor={optionId} className="flex-grow">
                    <Input 
                        value={option.text} 
                        onChange={(e) => onOptionChange(field.id, index, { text: e.target.value })} 
                        className="h-8"
                    />
                </Label>
                {showScoring && (
                     <div className="flex items-center gap-1 shrink-0">
                        <Input 
                            type="number" 
                            value={option.points || 0} 
                            onChange={(e) => handlePointsChange(index, e.target.value)} 
                            className="w-16 h-8 text-center"
                        />
                        <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70" onClick={() => onOptionDelete(field.id, index)}><X/></Button>
            </div>
        );
    };

    if (field.type === 'SINGLE_CHOICE' || field.type === 'MULTIPLE_CHOICE') {
        return (
            <div className="space-y-2 mt-2">
                {options.map(renderOption)}
                <Button variant="outline" size="sm" onClick={() => onOptionAdd(field.id)}>+ Añadir opción</Button>
            </div>
        );
    }
    
    return null;
   };


    return (
      <Card className="p-4 bg-muted/50 border-l-4" style={{borderColor: 'hsl(var(--primary))'}}>
          <div className="flex items-start gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab"/>
              <div className="flex-grow space-y-2">
                  <Input 
                      name="label" 
                      value={field.label} 
                      onChange={handleInputChange} 
                      placeholder="Escribe tu pregunta aquí..." 
                      className="text-base font-semibold border-0 border-b-2 rounded-none px-1 focus-visible:ring-0"
                  />
                  <Input 
                      name="placeholder" 
                      value={field.placeholder || ''} 
                      onChange={handleInputChange}
                      placeholder="Texto de ejemplo o ayuda (opcional)" 
                      className="text-xs h-8"
                  />
              </div>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(field.id)}><Trash2 className="h-4 w-4"/></Button>
          </div>
          {renderOptionsEditor()}

          <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                  <Switch id={`required-${field.id}`} checked={field.required} onCheckedChange={(c) => handleSwitchChange(c, 'required')} />
                  <Label htmlFor={`required-${field.id}`}>Requerido</Label>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-40">
                      <Select value={field.type} onValueChange={(v) => onUpdate(field.id, { type: v, options: v === 'SHORT_TEXT' || v === 'LONG_TEXT' ? [] : field.options || [{id: generateUniqueId('opt'), text: 'Opción 1', isCorrect: true, points: 10}] })}>
                          <SelectTrigger>
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="SHORT_TEXT"><Type className="inline-block mr-2 h-4 w-4"/>Texto Corto</SelectItem>
                              <SelectItem value="LONG_TEXT"><MessageSquare className="inline-block mr-2 h-4 w-4"/>Párrafo</SelectItem>
                              <SelectItem value="SINGLE_CHOICE"><ListChecks className="inline-block mr-2 h-4 w-4"/>Opción Única</SelectItem>
                              <SelectItem value="MULTIPLE_CHOICE"><CheckSquare className="inline-block mr-2 h-4 w-4"/>Casillas</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
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
            label: 'Nueva Pregunta',
            type,
            required: false,
            options: type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE' ? [{id: generateUniqueId('opt'), text: 'Opción 1', isCorrect: true, points: 10}, {id: generateUniqueId('opt'), text: 'Opción 2', isCorrect: false, points: 0}] : [],
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
                const newOptions = (f.options as FormFieldOption[]).map(opt => {
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
                 // If the deleted option was the correct one, set the first one as correct
                if (f.type === 'SINGLE_CHOICE' && newOptions.length > 0 && !newOptions.some(opt => opt.isCorrect)) {
                    newOptions[0].isCorrect = true;
                }
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
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8"/></div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                     <Input value={form.title} onChange={e => handleFormUpdate({ title: e.target.value })} className="text-2xl font-bold h-auto p-1 border-0 focus-visible:ring-1"/>
                     <Input value={form.description} onChange={e => handleFormUpdate({ description: e.target.value })} placeholder="Añade una descripción..." className="text-sm text-muted-foreground h-auto p-1 border-0 focus-visible:ring-1 mt-1"/>
                 </div>
                 <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" asChild><Link href={`/forms/${formId}/results`}><BarChart className="mr-2 h-4 w-4"/>Resultados</Link></Button>
                     <Button variant="outline" size="sm" asChild><Link href={`/forms/${formId}/view`} target="_blank"><Eye className="mr-2 h-4 w-4"/>Vista Previa</Link></Button>
                     <Button onClick={handleSaveChanges} disabled={isSaving || !isDirty} size="sm">
                         {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                         Guardar
                     </Button>
                 </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="form-fields" type="FIELDS">
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
                     {form.fields.length === 0 && (
                        <div className="text-center border-2 border-dashed rounded-lg p-12">
                            <FilePen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">¡Empieza a construir!</h3>
                            <p className="text-muted-foreground mb-6">Usa los botones del panel derecho para añadir tu primera pregunta.</p>
                        </div>
                     )}
                </div>
                
                 <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                     <Card>
                         <CardHeader><CardTitle className="text-base">Añadir Campo</CardTitle></CardHeader>
                         <CardContent className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => addField('SHORT_TEXT')}><Type className="mr-2 h-4 w-4"/>Texto Corto</Button>
                            <Button variant="outline" onClick={() => addField('LONG_TEXT')}><MessageSquare className="mr-2 h-4 w-4"/>Párrafo</Button>
                            <Button variant="outline" onClick={() => addField('SINGLE_CHOICE')}><ListChecks className="mr-2 h-4 w-4"/>Opción Única</Button>
                            <Button variant="outline" onClick={() => addField('MULTIPLE_CHOICE')}><CheckSquare className="mr-2 h-4 w-4"/>Casillas</Button>
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
                             <TabsContent value="properties" className="pt-4 space-y-4">
                                <div className="space-y-3">
                                     <div className="flex items-center justify-between space-x-2 p-2 border rounded-lg">
                                         <Label htmlFor="quiz-mode" className="font-semibold">Habilitar Puntuación</Label>
                                         <Switch id="quiz-mode" checked={!!form.isQuiz} onCheckedChange={(c) => handleFormUpdate({ isQuiz: c })}/>
                                     </div>
                                     <p className="text-xs text-muted-foreground">Convierte este formulario en una evaluación con puntos por respuesta.</p>
                                     {form.isQuiz && (
                                         <Alert variant="default" className="text-xs">
                                             <Info className="h-4 w-4"/>
                                             <AlertDescription>
                                                 Recuerda: la puntuación solo funciona para preguntas de <span className="font-semibold">Opción Única</span>. Asigna puntos a las opciones para que el cálculo funcione.
                                             </AlertDescription>
                                         </Alert>
                                     )}
                                 </div>
                                 <div className="space-y-2">
                                      <Label htmlFor="form-status">Estado del Formulario</Label>
                                      <Select value={form.status} onValueChange={v => handleFormUpdate({ status: v as FormStatus })}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="DRAFT">Borrador</SelectItem>
                                              <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                              <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                          </SelectContent>
                                      </Select>
                                 </div>
                             </TabsContent>
                             <TabsContent value="share" className="pt-4">
                               {form.status === 'PUBLISHED' && (
                                 <div className="space-y-2">
                                      <Label htmlFor="share-link">Enlace para Compartir</Label>
                                      <div className="flex items-center gap-2">
                                        <Input id="share-link" readOnly value={`${window.location.origin}/forms/${formId}/view`} />
                                        <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}/view`); toast({description: 'Enlace copiado al portapapeles.'})}}><Copy className="h-4 w-4"/></Button>
                                      </div>
                                 </div>
                               )}
                                {form.status !== 'PUBLISHED' && (
                                    <p className="text-sm text-muted-foreground text-center p-4 border rounded-lg">Publica el formulario para obtener el enlace para compartir.</p>
                                )}
                             </TabsContent>
                           </Tabs>
                        </CardContent>
                     </Card>
                 </div>
            </main>
        </div>
    );
}
