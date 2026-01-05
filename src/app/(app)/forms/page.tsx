
"use client";

import React from "react";
import ModernFormsDashboard from "@/components/forms/modern-forms-dashboard";
import { useTitle } from "@/contexts/title-context";

export default function FormsPage() {
    const { setPageTitle } = useTitle();

    React.useEffect(() => {
        setPageTitle('Gestión de Formularios');
    }, [setPageTitle]);

    return (
        <div className="container mx-auto py-8">
            <ModernFormsDashboard />
        </div>
    );
}
