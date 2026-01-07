// src/components/quizz-it/editor/properties-panel.tsx
'use client';

import { useState } from 'react';
import { Settings, ListChecks, GitBranch, Palette, Plus, Trash2, Timer, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Question, AnswerOption } from '@/types';
import { generateUniqueId } from '@/lib/editor-utils';

interface PropertiesPanelProps {
    question: Question | null;
    onUpdateQuestion: (updates: Partial<Question>) => void;
}

export function PropertiesPanel({ question, onUpdateQuestion }: PropertiesPanelProps) {
    if (!question) {
        return (
            <div className="flex flex-col h-full bg-muted/30 border-l">
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <div className="space-y-3">
                        <Settings className="h-12 w-12 mx-auto text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                            Selecciona una pregunta para ver sus propiedades
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-muted/30 border-l">
            {/* Header */}
            <div className="p-4 border-b bg-background/50">
                <h3 className="font-semibold text-sm">Propiedades</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Configura los detalles de la pregunta
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-4 grid grid-cols-3 gap-1">
                    <TabsTrigger value="content" className="text-xs gap-1">
                        <ListChecks className="h-3 w-3" />
                        <span className="hidden sm:inline">Contenido</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs gap-1">
                        <Settings className="h-3 w-3" />
                        <span className="hidden sm:inline">Ajustes</span>
                    </TabsTrigger>
                    <TabsTrigger value="logic" className="text-xs gap-1">
                        <GitBranch className="h-3 w-3" />
                        <span className="hidden sm:inline">Lógica</span>
                    </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <TabsContent value="content" className="p-4 space-y-4 mt-0">
                        <ContentTab question={question} onUpdateQuestion={onUpdateQuestion} />
                    </TabsContent>

                    <TabsContent value="settings" className="p-4 space-y-4 mt-0">
                        <SettingsTab question={question} onUpdateQuestion={onUpdateQuestion} />
                    </TabsContent>

                    <TabsContent value="logic" className="p-4 space-y-4 mt-0">
                        <LogicTab question={question} onUpdateQuestion={onUpdateQuestion} />
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
}

function ContentTab({ question, onUpdateQuestion }: { question: Question; onUpdateQuestion: (updates: Partial<Question>) => void }) {
    const addOption = () => {
        const newOption: AnswerOption = {
            id: generateUniqueId('option'),
            text: '',
            isCorrect: false,
            points: 10,
        };
        onUpdateQuestion({
            options: [...question.options, newOption],
        });
    };

    const removeOption = (optionId: string) => {
        onUpdateQuestion({
            options: question.options.filter(opt => opt.id !== optionId),
        });
    };

    return (
        <div className="space-y-4">
            {/* Question Type */}
            <div className="space-y-2">
                <Label className="text-xs">Tipo de Pregunta</Label>
                <Select
                    value={question.type}
                    onValueChange={(value) => onUpdateQuestion({ type: value as any })}
                >
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MULTIPLE_CHOICE">Múltiple Elección</SelectItem>
                        <SelectItem value="SINGLE_CHOICE">Elección Única</SelectItem>
                        <SelectItem value="TRUE_FALSE">Verdadero/Falso</SelectItem>
                        <SelectItem value="OPEN_ENDED">Respuesta Abierta</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
                <Label className="text-xs">Texto de la Pregunta</Label>
                <Textarea
                    value={question.text}
                    onChange={(e) => onUpdateQuestion({ text: e.target.value })}
                    placeholder="Escribe tu pregunta aquí..."
                    className="min-h-[100px] text-sm resize-none"
                />
            </div>

            {/* Options */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Opciones de Respuesta</Label>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="h-7 text-xs gap-1"
                    >
                        <Plus className="h-3 w-3" />
                        Agregar
                    </Button>
                </div>

                <div className="space-y-2">
                    {question.options.map((option, index) => (
                        <div key={option.id} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 p-2 rounded-lg border bg-background">
                                <span className="text-xs font-medium text-muted-foreground w-6">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <Input
                                    value={option.text}
                                    onChange={(e) => {
                                        onUpdateQuestion({
                                            options: question.options.map(opt =>
                                                opt.id === option.id ? { ...opt, text: e.target.value } : opt
                                            ),
                                        });
                                    }}
                                    placeholder="Texto de la opción..."
                                    className="h-7 text-xs border-none shadow-none"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(option.id)}
                                disabled={question.options.length <= 2}
                                className="h-7 w-7 p-0"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ question, onUpdateQuestion }: { question: Question; onUpdateQuestion: (updates: Partial<Question>) => void }) {
    return (
        <div className="space-y-4">
            {/* Timer */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-2">
                        <Timer className="h-3 w-3" />
                        Temporizador
                    </Label>
                    <Switch
                        checked={!!question.timestamp}
                        onCheckedChange={(checked) => {
                            onUpdateQuestion({ timestamp: checked ? 60 : undefined });
                        }}
                    />
                </div>

                {question.timestamp !== undefined && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Tiempo límite</span>
                            <span className="font-medium">{question.timestamp}s</span>
                        </div>
                        <Slider
                            value={[question.timestamp || 60]}
                            onValueChange={([value]) => onUpdateQuestion({ timestamp: value })}
                            min={10}
                            max={300}
                            step={10}
                            className="w-full"
                        />
                    </div>
                )}
            </div>

            {/* Points */}
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                    <Award className="h-3 w-3" />
                    Puntos Base
                </Label>
                <Input
                    type="number"
                    value={question.options[0]?.points || 10}
                    onChange={(e) => {
                        const points = parseInt(e.target.value) || 10;
                        onUpdateQuestion({
                            options: question.options.map(opt => ({ ...opt, points })),
                        });
                    }}
                    min={1}
                    max={100}
                    className="h-9 text-sm"
                />
            </div>

            {/* Order */}
            <div className="space-y-2">
                <Label className="text-xs">Orden</Label>
                <Input
                    type="number"
                    value={question.order}
                    onChange={(e) => onUpdateQuestion({ order: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="h-9 text-sm"
                />
            </div>
        </div>
    );
}

function LogicTab({ question, onUpdateQuestion }: { question: Question; onUpdateQuestion: (updates: Partial<Question>) => void }) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-6 text-center">
                <GitBranch className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                    Lógica Condicional
                </p>
                <p className="text-xs text-muted-foreground">
                    Próximamente: Define saltos y ramificaciones basadas en respuestas
                </p>
            </div>
        </div>
    );
}
