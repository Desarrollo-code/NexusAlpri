// src/components/forms/form-viewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Form, FormField as PrismaFormField } from '@prisma/client';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import type { FormFieldOption } from '@/types';

type FullForm = Form & { fields: (PrismaFormField & { options: FormFieldOption[] })[] };


const FormFieldRenderer = ({ field, value, onChange }: { field: FullForm['fields'][0], value: any, onChange: (fieldId: string, value: any) => void }) => {
    const fieldId = `field-${field.id}`;
    
    const renderInput = () => {
        switch (field.type) {
            case 'SHORT_TEXT':
                return <Input id={fieldId} value={value || ''} onChange={(e) => onChange(field.id, e.target.value)} placeholder={field.placeholder || ''} required={field.required}/>;
            case 'LONG_TEXT':
                return <Textarea id={fieldId} value={value || ''} onChange={(e) => onChange(field.id, e.target.value)} placeholder={field.placeholder || ''} required={field.required}/>;
            case 'SINGLE_CHOICE':
                 return (
                    <RadioGroup id={fieldId} value={value} onValueChange={(val) => onChange(field.id, val)} className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                            <div key={opt.id} className="flex items-center space-x-2"><RadioGroupItem value={opt.id} id={`${fieldId}-${i}`} /><Label htmlFor={`${fieldId}-${i}`} className="font-normal">{opt.text}</Label></div>
                        ))}
                    </RadioGroup>
                );
            case 'MULTIPLE_CHOICE':
                const currentValues = new Set(value || []);
                return (
                     <div id={fieldId} className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                           <div key={opt.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`${fieldId}-${i}`} 
                                    checked={currentValues.has(opt.id)}
                                    onCheckedChange={(checked) => {
                                        const newValues = new Set(currentValues);
                                        if (checked) newValues.add(opt.id); else newValues.delete(opt.id);
                                        onChange(field.id, Array.from(newValues));
                                    }}
                                />
                                <Label htmlFor={`${fieldId}-${i}`} className="font-normal">{opt.text}</Label>
                            </div>
                        ))}
                    </div>
                );
            default:
                return <p className="text-sm text-destructive">Tipo de campo no soportado</p>;
        }
    }
    
    return (
        <Card className="bg-muted/30">
             <CardContent className="p-4">
                <Label htmlFor={fieldId} className="text-base font-semibold">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                <div className="mt-3">{renderInput()}</div>
            CardContent>
        </Card>
    );
};

export function FormViewer({ formId }: { formId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();

    const [form, setForm] = useState<FullForm | null>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [finalScore, setFinalScore] = useState<number | null>(null);
    
    useEffect(() => {
        const fetchForm = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/forms/${formId}`);
                if (!res.ok) throw new Error('No se pudo cargar el formulario o no tienes permiso.');
                const data = await res.json();
                if (data.status !== 'PUBLISHED') throw new Error('Este formulario no está aceptando respuestas actualmente.');
                setForm(data);
                setPageTitle(`Formulario: ${data.title}`);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchForm();
    }, [formId, setPageTitle]);

    const handleAnswerChange = (fieldId: string, value: any) => {
        setAnswers(prev => ({...prev, [fieldId]: value}));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/forms/${formId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'No se pudo enviar la respuesta.');
            setIsSubmitted(true);
            setFinalScore(data.score); // Store the score from the response
            toast({ title: '¡Respuesta Enviada!', description: 'Gracias por completar el formulario.' });
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Card className="m-auto mt-10 max-w-lg text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4"/><h2 className="text-xl font-semibold">Error al Cargar</h2><p className="text-muted-foreground">{error}</p><Button className="mt-4" onClick={() => router.back()}>Volver</Button></Card>;
    if (!form) return null;
    
    if (isSubmitted) {
        return (
            <Card className="m-auto mt-10 max-w-lg text-center p-8">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold">¡Gracias!</h2>
                <p className="text-muted-foreground mt-2">Tu respuesta al formulario "{form.title}" ha sido registrada.</p>
                {finalScore !== null && (
                    
                        Tu puntuación final es:
                        
                        {finalScore.toFixed(0)}%
                    
                )}
                <Button className="mt-6" onClick={() => router.push('/dashboard')}>Volver al Panel Principal</Button>
            </Card>
        );
    }
    
    return (
        <Card className="max-w-3xl mx-auto my-8">
            
                
                    {form.title}
                    {form.description && {form.description}}
                
            
            
                
                    {form.fields.map(field => (
                        <FormFieldRenderer key={field.id} field={field} value={answers[field.id]} onChange={handleAnswerChange} />
                    ))}
                    
                        
                            {isSubmitting ?  Enviar Respuesta
                        
                    
                
            
        </Card>
    );
}
