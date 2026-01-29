'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Course Page Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center space-y-6">
            <div className="h-24 w-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-3xl font-bold tracking-tight">¡Ups! Algo salió mal</h2>
                <p className="text-muted-foreground text-lg">
                    No pudimos cargar el contenido del curso. Esto puede deberse a un problema de conexión o un error temporal.
                </p>
                <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                    Error: {error.message || "Unknown error"}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 min-w-[200px]">
                <Button
                    size="lg"
                    onClick={() => reset()}
                    className="gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Intentar de nuevo
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="gap-2"
                >
                    <Link href="/dashboard">
                        <Home className="h-4 w-4" />
                        Volver al Inicio
                    </Link>
                </Button>
            </div>
        </div>
    );
}
