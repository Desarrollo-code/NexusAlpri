// src/components/forms/form-viewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/contexts/title-context';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Send, CheckCircle, Sparkles, Award, TrendingUp } from 'lucide-react';
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
                return (
                    <Input 
                        id={fieldId} 
                        value={value || ''} 
                        onChange={(e) => onChange(field.id, e.target.value)} 
                        placeholder={field.placeholder || 'Escribe tu respuesta aquí...'} 
                        required={field.required}
                        className="transition-all duration-200 focus:scale-[1.01]"
                    />
                );
            case 'LONG_TEXT':
                return (
                    <Textarea 
                        id={fieldId} 
                        value={value || ''} 
                        onChange={(e) => onChange(field.id, e.target.value)} 
                        placeholder={field.placeholder || 'Escribe tu respuesta detallada aquí...'} 
                        required={field.required}
                        className="min-h-[120px] transition-all duration-200 focus:scale-[1.01]"
                    />
                );
            case 'SINGLE_CHOICE':
                 return (
                    <RadioGroup id={fieldId} value={value} onValueChange={(val) => onChange(field.id, val)} className="space-y-3">
                        {(field.options || []).map((opt, i) => (
                            <div 
                                key={opt.id} 
                                className="flex items-center space-x-3 p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                            >
                                <RadioGroupItem value={opt.id} id={`${fieldId}-${i}`} className="shrink-0" />
                                <Label 
                                    htmlFor={`${fieldId}-${i}`} 
                                    className={cn(
                                        "font-normal cursor-pointer flex-grow",
                                        fontStyle && `font-${fontStyle}`,
                                        "group-hover:text-primary transition-colors"
                                    )}
                                >
                                    {opt.text}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case 'MULTIPLE_CHOICE':
                const currentValues = new Set(value || []);
                return (
                     <div id={fieldId} className="space-y-3">
                        {(field.options || []).map((opt, i) => (
                           <div 
                                key={opt.id} 
                                className="flex items-center space-x-3 p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
                           >
                                <Checkbox 
                                    id={`${fieldId}-${i}`} 
                                    checked={currentValues.has(opt.id)}
                                    onCheckedChange={(checked) => {
                                        const newValues = new Set(currentValues);
                                        if (checked) newValues.add(opt.id); else newValues.delete(opt.id);
                                        onChange(field.id, Array.from(newValues));
                                    }}
                                    className="shrink-0"
                                />
                                <Label 
                                    htmlFor={`${fieldId}-${i}`} 
                                    className={cn(
                                        "font-normal cursor-pointer flex-grow",
                                        fontStyle && `font-${fontStyle}`,
                                        "group-hover:text-primary transition-colors"
                                    )}
                                >
                                    {opt.text}
                                </Label>
                            </div>
                        ))}
                    </div>
                );
            default:
                return <p className="text-sm text-destructive">Tipo de campo no soportado</p>;
        }
    }
    
    return (
        <Card className="bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
             <CardContent className="p-6">
                <Label 
                    htmlFor={fieldId} 
                    className={cn(
                        "text-lg font-semibold mb-4 block",
                        fontStyle && `font-${fontStyle}`,
                        "group-hover:text-primary transition-colors"
                    )}
                >
                    {field.label}
                    {field.required && <span className="text-destructive ml-1.5 text-xl">*</span>}
                </Label>
                <div className="mt-4">{renderInput()}</div>
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
            setFinalScore(data.score);
            toast({ title: '¡Respuesta Enviada!', description: 'Gracias por completar el formulario.' });
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background via-muted/20 to-background">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando formulario...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-destructive/5 to-background">
                <Card className="m-auto max-w-lg text-center p-8 shadow-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
                        <AlertTriangle className="h-8 w-8 text-destructive"/>
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Error al Cargar</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button onClick={() => router.back()} variant="outline" size="lg">Volver</Button>
                </Card>
            </div>
        );
    }
    
    if (!form) return null;
    
    const fontStyle = form.fontStyle === 'serif' ? 'font-serif' : form.fontStyle === 'mono' ? 'font-mono' : 'font-sans';

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
                <Card className="m-auto max-w-lg text-center p-10 shadow-2xl animate-in zoom-in duration-500">
                    <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"/>
                        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600">
                            <CheckCircle className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        ¡Gracias!
                    </h2>
                    <p className="text-muted-foreground text-lg mb-6">
                        Tu respuesta al formulario <span className="font-semibold text-foreground">"{form.title}"</span> ha sido registrada exitosamente.
                    </p>
                    {finalScore !== null && (
                        <div className="relative mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 overflow-hidden">
                            <div className="absolute top-0 right-0 opacity-10">
                                <Award className="h-32 w-32 text-primary"/>
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <TrendingUp className="h-5 w-5 text-primary"/>
                                    <p className="text-sm font-medium text-primary">Tu puntuación final</p>
                                </div>
                                <p className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                    {finalScore.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    )}
                    <Button 
                        className="mt-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                        size="lg"
                        onClick={() => router.push('/dashboard')}
                    >
                        Volver al Panel Principal
                    </Button>
                </Card>
            </div>
        );
    }
    
    return (
        <div 
            className="min-h-screen w-full py-12 px-4" 
            style={{ 
                backgroundColor: form.backgroundColor || undefined, 
                fontFamily: form.fontStyle ? (fontMap[form.fontStyle as keyof typeof fontMap] as any)?.style.fontFamily : undefined 
            }}
        >
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="shadow-2xl overflow-hidden border-2" style={{'--form-theme-color': form.themeColor || 'hsl(var(--primary))'} as React.CSSProperties}>
                    <div className="w-full h-2 bg-gradient-to-r from-transparent via-[var(--form-theme-color)] to-transparent"/>
                    {form.headerImageUrl && (
                        <div className="w-full h-64 relative overflow-hidden">
                            <Image 
                                src={form.headerImageUrl} 
                                alt="Encabezado del formulario" 
                                fill 
                                className="object-cover hover:scale-105 transition-transform duration-500" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"/>
                        </div>
                    )}
                    <CardHeader className="text-center pt-12 pb-8 px-8 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--form-theme-color)] to-[var(--form-theme-color)]/60 flex items-center justify-center shadow-lg">
                                <Sparkles className="h-6 w-6 text-white"/>
                            </div>
                        </div>
                        <CardTitle className={cn(
                            "text-4xl md:text-5xl font-headline mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent", 
                            fontStyle
                        )}>
                            {form.title}
                        </CardTitle>
                        {form.description && (
                            <CardDescription className={cn("text-lg max-w-2xl mx-auto", fontStyle)}>
                                {form.description}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 p-8">
                            {form.fields.map((field, index) => (
                                <div 
                                    key={field.id}
                                    className="animate-in slide-in-from-bottom-4 duration-500"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <FormFieldRenderer 
                                        field={field} 
                                        value={answers[field.id]} 
                                        onChange={handleAnswerChange} 
                                        fontStyle={fontStyle} 
                                    />
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="p-8 bg-gradient-to-r from-muted/50 to-transparent">
                            <Button 
                                type="submit" 
                                className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                                disabled={isSubmitting} 
                                style={{ 
                                    backgroundColor: 'var(--form-theme-color)',
                                    '--tw-shadow-color': 'var(--form-theme-color)'
                                } as React.CSSProperties}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5"/>
                                        Enviar Respuesta
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
