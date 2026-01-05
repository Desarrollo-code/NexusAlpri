
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, UploadCloud, CheckCircle2, Star } from "lucide-react";
import { FormField } from "./form-editor";

// --- MOCK PROPS ---
interface FormViewerProps {
    fields: FormField[];
    title: string;
    description?: string;
}

export default function FormViewer({ fields, title, description }: FormViewerProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Derive pages
    const totalPages = Math.max(...fields.map((f) => f.page || 1));
    const currentFields = fields.filter((f) => (f.page || 1) === currentPage);
    const progress = (currentPage / totalPages) * 100;

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
        else setIsSubmitted(true);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const renderField = (field: FormField) => {
        const handleChange = (val: any) => {
            setAnswers(prev => ({ ...prev, [field.id]: val }));
        }
        const value = answers[field.id];

        switch (field.type) {
            case "SHORT_TEXT":
                return <Input placeholder={field.placeholder} value={value || ""} onChange={(e) => handleChange(e.target.value)} />;
            case "PARAGRAPH":
                return <Textarea placeholder={field.placeholder} value={value || ""} onChange={(e) => handleChange(e.target.value)} />;
            case "SINGLE_CHOICE":
                return (
                    <RadioGroup value={value} onValueChange={handleChange}>
                        {field.options?.map((opt) => (
                            <div key={opt} className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                                <Label htmlFor={`${field.id}-${opt}`}>{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case "MULTIPLE_CHOICE":
                return (
                    <div className="space-y-2">
                        {field.options?.map((opt) => {
                            const checked = (value || []).includes(opt);
                            return (
                                <div key={opt} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${field.id}-${opt}`}
                                        checked={checked}
                                        onCheckedChange={(c) => {
                                            const current = value || [];
                                            const next = c ? [...current, opt] : current.filter((v: string) => v !== opt);
                                            handleChange(next);
                                        }}
                                    />
                                    <Label htmlFor={`${field.id}-${opt}`}>{opt}</Label>
                                </div>
                            )
                        })}
                    </div>
                );
            case "SLIDER":
                return (
                    <div className="pt-4 px-2">
                        <Slider
                            min={0}
                            max={10}
                            step={1}
                            value={[value || 0]}
                            onValueChange={(vals) => handleChange(vals[0])}
                        />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>0 (Nada probable)</span>
                            <span>10 (Muy probable)</span>
                        </div>
                    </div>
                );
            case "STAR_RATING":
                return (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleChange(star)}
                                className={`p-1 rounded-full transition-colors ${value >= star ? "text-yellow-400" : "text-slate-200"}`}
                            >
                                <Star className="h-8 w-8 fill-current" />
                            </button>
                        ))}
                    </div>
                );
            case "FILE_UPLOAD":
                return (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                        <UploadCloud className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Arrastra archivos aquí o haz clic para subir</p>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto mt-20 text-center"
            >
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Gracias por tu respuesta!</h2>
                <p className="text-slate-500 mb-8">Tus datos han sido registrados correctamente.</p>
                <Button onClick={() => window.location.reload()}>Enviar otra respuesta</Button>
            </motion.div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <Card className="shadow-lg border-t-8 border-t-primary">
                <CardHeader>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                    {description && <p className="text-muted-foreground">{description}</p>}
                </CardHeader>
                {totalPages > 1 && (
                    <div className="px-6 pb-6">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Paso {currentPage} de {totalPages}</span>
                            <span>{Math.round(progress)}% Completado</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                <div className="px-6 py-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {currentFields.map((field) => (
                                <div key={field.id} className="space-y-3">
                                    <Label className="text-base font-medium">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    {renderField(field)}
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <CardFooter className="flex justify-between mt-8 pt-6 border-t bg-slate-50/50">
                    <Button variant="ghost" onClick={handlePrev} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                    </Button>
                    <Button onClick={handleNext}>
                        {currentPage === totalPages ? "Enviar" : "Siguiente"}
                        {currentPage !== totalPages && <ChevronRight className="h-4 w-4 ml-2" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
