
"use client";

import React from "react";
import ModernFormsDashboard from "@/components/forms/modern-forms-dashboard";

export default function FormsPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Gestión de Formularios</h1>
                <p className="text-muted-foreground">Crea, edita y analiza tus encuestas y evaluaciones.</p>
            </div>

            <ModernFormsDashboard />
        </div>
    );
}
