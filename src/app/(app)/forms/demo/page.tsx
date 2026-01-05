
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormEditor from "@/components/forms/form-editor";
import FormViewer from "@/components/forms/form-viewer";
import FormResultsView from "@/components/forms/form-results-view";
import { FormField } from "@/components/forms/form-editor";

const DEMO_FIELDS: FormField[] = [
    { id: "1", type: "SHORT_TEXT", label: "¿Cuál es tu nombre?", required: true, page: 1 },
    { id: "2", type: "SINGLE_CHOICE", label: "¿Cómo calificarías el servicio?", options: ["Excelente", "Bueno", "Malo"], required: true, page: 1 },
    { id: "3", type: "STAR_RATING", label: "Danos una puntuación", required: false, page: 2 },
    { id: "4", type: "PARAGRAPH", label: "Comentarios adicionales", required: false, page: 2 },
];

export default function FormDemoPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Módulo de Formularios Avanzados</h1>
            <Tabs defaultValue="editor" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="editor">Editor (Drag & Drop)</TabsTrigger>
                    <TabsTrigger value="viewer">Vista Usuario (Multi-page)</TabsTrigger>
                    <TabsTrigger value="results">Resultados (Analytics)</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="border rounded-xl shadow-sm outline-none">
                    <FormEditor />
                </TabsContent>

                <TabsContent value="viewer" className="bg-slate-50 p-8 rounded-xl border min-h-[600px] outline-none">
                    <FormViewer
                        fields={DEMO_FIELDS}
                        title="Encuesta de Demo"
                        description="Esta es una vista previa de cómo los usuarios verán el formulario."
                    />
                </TabsContent>

                <TabsContent value="results" className="outline-none">
                    <FormResultsView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
