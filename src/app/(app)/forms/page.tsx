// src/app/(app)/forms/page.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle } from 'lucide-react';
import { useTitle } from '@/contexts/title-context';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function FormsPage() {
    const { setPageTitle } = useTitle();
    const { user } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        setPageTitle('Formularios');
    }, [setPageTitle]);
    
    // Redirect if user is not an admin or instructor
    React.useEffect(() => {
        if (user && user.role !== 'ADMINISTRATOR' && user.role !== 'INSTRUCTOR') {
            router.push('/dashboard');
        }
    }, [user, router]);

    return (
        <div className="space-y-8">
            <div>
                <p className="text-muted-foreground">
                    Crea, gestiona y analiza encuestas, evaluaciones y formularios personalizados.
                </p>
            </div>
            
            <div className="text-center border-2 border-dashed rounded-lg p-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bienvenido a Formularios</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Aquí podrás ver todos tus formularios. ¡Crea el primero para empezar a recolectar información!
                </p>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Nuevo Formulario
                </Button>
            </div>
        </div>
    );
}
