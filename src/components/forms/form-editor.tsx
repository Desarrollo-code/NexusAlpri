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
    onUpdate: (id: string, updates: Partial) => void, 
    onDelete: (id: string) => void,
    onOptionChange: (fieldId: string, optionIndex: number, updates: Partial<{text: string; points: number}>) => void,
    onOptionAdd: (fieldId: string) => void,
    onOptionDelete: (fieldId: string, optionIndex: number) => void,
    onCorrectChange: (fieldId: string, optionId: string, isCorrect: boolean) => void,
    isSaving: boolean 
}) => {
    
    const handleInputChange = (e: React.ChangeEvent) => {
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
            
                {field.type === 'SINGLE_CHOICE' ? (
                    
                ) : (
                    
                )}
                 
                    
                        
                            
                        
                    
                
                {showScoring && (
                     
                        
                            
                            
                            pts
                        
                    
                )}
                 
                    
                
            
        );
    };

    if (field.type === 'SINGLE_CHOICE') {
        return (
            
                
                {options.map(renderOption)}
                 + Añadir opción
                
            
        );
    }
    
    if (field.type === 'MULTIPLE_CHOICE') {
        return (
            
                {options.map(renderOption)}
                 + Añadir opción
                
            
        );
    }

    return null;
};


    return (
      
          
              
                  
                  
                      
                          Escribe tu pregunta aquí...
                          
                      
                      
                          Texto de ejemplo o ayuda (opcional)
                          
                      
                  
                   
                      
                  
              
          
          {renderOptionsEditor()}

          
              
                  
                      
                           Requerido
                      
                  
                  
                      
                  
                      
                          
                          
                          
                      
                      
                          
                              Texto Corto
                              Párrafo
                              Opción Única
                              Casillas
                          
                      
                  
              
          
      
    );
};


// Componente principal del editor de formularios
export function FormEditor({ formId }: { formId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();

    const [form, setForm] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    
    const handleFormUpdate = (updates: Partial) => {
        setForm(prev => prev ? { ...prev, ...updates } : null);
        setIsDirty(true);
    };

    const handleFieldUpdate = (fieldId: string, updates: Partial) => {
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
        return ;
    }

    return (
        
            
                 
                     
                         
                         
                     
                     
                         
                         Resultados
                         
                        Vista Previa
                     
                     
                         
                         {isSaving ?  : }
                         Guardar
                     
                 
            

            
                
                    
                        
                            
                                {form.fields.map((field, index) => (
                                         
                                             {(provided) => (
                                                 
                                                     
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
                                                 
                                              )}
                                         
                                     ))}
                                     {provided.placeholder}
                                
                            
                        
                         {form.fields.length === 0 && (
                            
                                
                                    
                                        ¡Empieza a construir!
                                        Usa los botones del panel derecho para añadir tu primera pregunta.
                                    
                                
                            
                         )}
                
                
                     
                         
                            
                                Añadir Campo
                            
                         
                         
                            
                                
                                    
                                    
                                        Texto Corto
                                    
                                    
                                        Párrafo
                                    
                                    
                                        Opción Única
                                    
                                    
                                        Casillas
                                    
                                 
                         
                      
                       
                            
                                Configuración
                            
                       
                         
                           
                             
                               Propiedades
                               Compartir
                             
                             
                                
                                     
                                         Habilitar Puntuación
                                         
                                     
                                     Convierte este formulario en una evaluación con puntos por respuesta.
                                     {form.isQuiz && (
                                         
                                             
                                             
                                                 Recuerda: la puntuación solo funciona para preguntas de . Asigna puntos a las opciones para que el cálculo funcione.
                                             
                                         
                                     )}
                                 
                                 
                                      
                                      
                                          
                                              
                                              
                                              
                                          
                                          
                                              Borrador
                                              Publicado
                                              Archivado
                                          
                                      
                                 
                             
                             
                               
                               {form.status === 'PUBLISHED' && (
                                 
                                      
                                          Enlace para Compartir
                                          
                                            
                                            
                                            
                                        
                                      
                                 
                               )}
                                {form.status !== 'PUBLISHED' && (
                                    
                                        Publica el formulario para obtener el enlace para compartir.
                                    
                                )}
                             
                           
                         
                      
                
            
        
    );
}
