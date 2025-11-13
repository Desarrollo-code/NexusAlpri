// src/components/forms/form-viewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { AppForm } from '@/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fontMap } from '@/lib/fonts';


const FormFieldRenderer = ({ field, value, onChange, fontStyle }: { field: AppForm['fields'][0], value: any, onChange: (fieldId: string, value: any) => void, fontStyle?: string | null }) => {
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
                            <div key={opt.id} className="flex items-center space-x-2"><RadioGroupItem value={opt.id} id={`${fieldId}-${i}`} /><Label htmlFor={`${fieldId}-${i}`} className={cn("font-normal", fontStyle && `font-${fontStyle}`)}>{opt.text}</Label></div>
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
                                <Label htmlFor={`${fieldId}-${i}`} className={cn("font-normal", fontStyle && `font-${fontStyle}`)}>{opt.text}</Label>
                            </div>
                        ))}
                    </div>
                );
            default:
                return <p className="text-sm text-destructive">Tipo de campo no soportado</p>;
        }
    }
    
    return (
        <Card className="bg-card/80 backdrop-blur-sm">
             <CardContent className="p-4">
                <Label htmlFor={fieldId} className={cn("text-base font-semibold", fontStyle && `font-${fontStyle}`)}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                <div className="mt-3">{renderInput()}</div>
            </CardContent>
        </Card>
    );
};

export function FormViewer({ formId }: { formId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { setPageTitle } = useTitle();

    const [form, setForm] = useState<AppForm | null>(null);
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
    
    const fontStyle = form.fontStyle === 'serif' ? 'font-serif' : form.fontStyle === 'mono' ? 'font-mono' : 'font-sans';

    if (isSubmitted) {
        return (
            <Card className="m-auto mt-10 max-w-lg text-center p-8">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold">¡Gracias!</h2>
                <p className="text-muted-foreground mt-2">Tu respuesta al formulario "{form.title}" ha sido registrada.</p>
                {finalScore !== null && (
                    <div className="mt-4 bg-primary/10 p-4 rounded-lg">
                        <p className="text-sm text-primary">Tu puntuación final es:</p>
                        <p className="text-3xl font-bold text-primary">{finalScore.toFixed(0)}%</p>
                    </div>
                )}
                <Button className="mt-6" onClick={() => router.push('/dashboard')}>Volver al Panel Principal</Button>
            </Card>
        );
    }
    
    return (
        <div style={{ backgroundColor: form.backgroundColor || undefined, fontFamily: form.fontStyle ? (fontMap[form.fontStyle as keyof typeof fontMap] as any)?.style.fontFamily : undefined }}>
            <div className="max-w-3xl mx-auto my-8 p-4">
                <Card className="shadow-2xl overflow-hidden" style={{'--form-theme-color': form.themeColor || 'hsl(var(--primary))'} as React.CSSProperties}>
                    <div className="w-full h-4" style={{ backgroundColor: 'var(--form-theme-color)' }}/>
                    {form.headerImageUrl && (
                        <div className="w-full h-48 relative">
                            <Image src={form.headerImageUrl} alt="Encabezado del formulario" fill className="object-cover" />
                        </div>
                    )}
                    <CardHeader className="text-center pt-8">
                        <CardTitle className={cn("text-4xl font-headline", fontStyle)}>{form.title}</CardTitle>
                        {form.description && <CardDescription className={cn("text-base", fontStyle)}>{form.description}</CardDescription>}
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {form.fields.map(field => (
                                <FormFieldRenderer key={field.id} field={field} value={answers[field.id]} onChange={handleAnswerChange} fontStyle={fontStyle} />
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting} style={{ backgroundColor: 'var(--form-theme-color)' }}>
                                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Send className="mr-2 h-5 w-5"/>}
                                 Enviar Respuesta
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
