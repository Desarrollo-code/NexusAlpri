
"use client";

import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    AlignLeft,
    CheckSquare,
    Circle,
    FileUp,
    GripVertical,
    Hash,
    Image as ImageIcon,
    MoreVertical,
    Plus,
    Settings,
    Star,
    Trash2,
    Type,
    ListOrdered
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- TYPES ---

export type FormFieldType =
    | "SHORT_TEXT"
    | "PARAGRAPH"
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "FILE_UPLOAD"
    | "STAR_RATING"
    | "SLIDER";

export interface FormField {
    id: string;
    type: FormFieldType;
    label: string;
    required: boolean;
    options?: string[]; // For choice types
    placeholder?: string;
    page?: number;
}

// --- MOCK DATA ---
const INITIAL_FIELDS: FormField[] = [
    { id: "1", type: "SHORT_TEXT", label: "¿Cuál es tu nombre completo?", required: true, page: 1 },
    { id: "2", type: "SINGLE_CHOICE", label: "Departamento", required: true, options: ["Ventas", "Marketing", "IT"], page: 1 },
];

const TOOLBOX_ITEMS: { type: FormFieldType; icon: React.ElementType; label: string }[] = [
    { type: "SHORT_TEXT", icon: Type, label: "Texto Corto" },
    { type: "PARAGRAPH", icon: AlignLeft, label: "Párrafo" },
    { type: "SINGLE_CHOICE", icon: Circle, label: "Opción Única" },
    { type: "MULTIPLE_CHOICE", icon: CheckSquare, label: "Opción Múltiple" },
    { type: "FILE_UPLOAD", icon: FileUp, label: "Subir Archivo" },
    { type: "STAR_RATING", icon: Star, label: "Rating" },
    { type: "SLIDER", icon: ListOrdered, label: "Escala Numérica" },
];

// --- COMPONENTS ---

function SortableField({ field, onDelete, onSelect, isSelected }: { field: FormField, onDelete: (id: string) => void, onSelect: (field: FormField) => void, isSelected: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group bg-white border rounded-lg p-4 mb-3 transition-colors hover:border-primary/50 cursor-pointer shadow-sm",
                isSelected ? "border-primary ring-1 ring-primary" : "border-slate-200"
            )}
            onClick={() => onSelect(field)}
        >
            <div className="absolute top-4 left-3 text-slate-400 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical className="h-5 w-5" />
            </div>

            <div className="pl-8 pr-8">
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                        {field.type.replace("_", " ")}
                    </Badge>
                    {field.required && <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 hover:bg-red-100">Requerido</Badge>}
                </div>
                <h4 className="font-medium text-slate-900">{field.label}</h4>
                {field.placeholder && <p className="text-sm text-slate-400 mt-1">{field.placeholder}</p>}

                {/* Preview of specialized fields */}
                {field.type === "STAR_RATING" && (
                    <div className="flex gap-1 mt-2 text-slate-300">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-5 w-5 fill-slate-200" />)}
                    </div>
                )}
                {(field.type === "SINGLE_CHOICE" || field.type === "MULTIPLE_CHOICE") && field.options && (
                    <div className="mt-2 space-y-1">
                        {field.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                {field.type === "SINGLE_CHOICE" ? <Circle className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                                {opt}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onDelete(field.id); }}

            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}

export default function FormEditor() {
    const [fields, setFields] = useState<FormField[]>(INITIAL_FIELDS);
    const [selectedField, setSelectedField] = useState<FormField | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addField = (type: FormFieldType) => {
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            label: "Nueva Pregunta",
            required: false,
            options: type.includes("CHOICE") ? ["Opción 1", "Opción 2"] : undefined,
            page: 1,
        };
        setFields([...fields, newField]);
        setSelectedField(newField);
    };

    const deleteField = (id: string) => {
        setFields(fields.filter((f) => f.id !== id));
        if (selectedField?.id === id) setSelectedField(null);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
        if (selectedField?.id === id) setSelectedField({ ...selectedField, ...updates });
    };

    return (
        <div className="flex bg-slate-50 border rounded-xl overflow-hidden h-[900px]">
            {/* TOOLBOX SIDEBAR */}
            <div className="w-64 bg-white border-r p-4 flex flex-col gap-4">
                <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Herramientas</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {TOOLBOX_ITEMS.map((item) => (
                            <Button
                                key={item.type}
                                variant="outline"
                                className="flex flex-col items-center justify-center h-20 gap-2 hover:border-primary hover:text-primary transition-colors"
                                onClick={() => addField(item.type)}
                            >
                                <item.icon className="h-6 w-6" />
                                <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-800 mb-1">Tip Pro</h4>
                    <p className="text-xs text-blue-600">
                        Puedes dividir el formulario en varias páginas usando el panel de propiedades.
                    </p>
                </div>
            </div>

            {/* CANVAS */}
            <div className="flex-1 p-8 overflow-y-auto bg-[url('/patterns/dots.svg')]">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-t-xl border-b shadow-sm mb-6 border-t-4 border-t-primary">
                        <Input
                            className="text-3xl font-bold border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-300"
                            placeholder="Título del Formulario"
                            defaultValue="Encuesta de Satisfacción 2024"
                        />
                        <Textarea
                            className="mt-2 border-none px-0 shadow-none focus-visible:ring-0 resize-none text-slate-500"
                            placeholder="Descripción del formulario..."
                            defaultValue="Por favor, tómate unos minutos para completar esta encuesta."
                        />
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {fields.length === 0 && (
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
                                        <p>Arrastra elementos o haz clic en la barra lateral para añadir preguntas.</p>
                                    </div>
                                )}
                                {fields.map((field) => (
                                    <SortableField
                                        key={field.id}
                                        field={field}
                                        onDelete={deleteField}
                                        onSelect={setSelectedField}
                                        isSelected={selectedField?.id === field.id}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* PROPERTIES PANEL */}
            <div className="w-80 bg-white border-l p-6 overflow-y-auto">
                {selectedField ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Propiedades</h3>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedField(null)}><Settings className="h-4 w-4" /></Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Etiqueta de la Pregunta</Label>
                                <Textarea
                                    value={selectedField.label}
                                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                <Label className="cursor-pointer" htmlFor="required-switch">Obligatorio</Label>
                                <Switch
                                    id="required-switch"
                                    checked={selectedField.required}
                                    onCheckedChange={(c) => updateField(selectedField.id, { required: c })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Página del Formulario</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={selectedField.page || 1}
                                    onChange={(e) => updateField(selectedField.id, { page: parseInt(e.target.value) })}
                                />
                            </div>

                            {(selectedField.type === "SINGLE_CHOICE" || selectedField.type === "MULTIPLE_CHOICE") && (
                                <div className="space-y-2">
                                    <Label>Opciones</Label>
                                    {selectedField.options?.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOptions = [...(selectedField.options || [])];
                                                    newOptions[idx] = e.target.value;
                                                    updateField(selectedField.id, { options: newOptions });
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    const newOptions = selectedField.options?.filter((_, i) => i !== idx);
                                                    updateField(selectedField.id, { options: newOptions });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-400" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-2 border-dashed"
                                        onClick={() => {
                                            const newOptions = [...(selectedField.options || []), `Opción ${(selectedField.options?.length || 0) + 1}`];
                                            updateField(selectedField.id, { options: newOptions });
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Añadir Opción
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t mt-6">
                            <h4 className="font-medium text-sm mb-3">Lógica Condicional (Beta)</h4>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-800">
                                La configuración avanzada de lógica condicional estará disponible en la próxima actualización.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                        <Settings className="h-12 w-12 mb-4 opacity-20" />
                        <p>Selecciona una pregunta para editar sus propiedades.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
