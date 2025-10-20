// src/app/(app)/security-audit/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useTitle } from '@/contexts/title-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const GlobalAccessMap = dynamic(
    () => import('@/components/security/global-access-map').then(mod => mod.GlobalAccessMap),
    { 
        ssr: false,
        loading: () => <div className="flex h-full w-full items-center justify-center bg-muted/30"><Loader2 className="h-8 w-8 animate-spin"/></div>
    }
);

export default function SecurityAuditPage() {
    const { setPageTitle } = useTitle();
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPageTitle('Auditoría de Seguridad');
        
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/security/logs?all=true');
                if (!response.ok) throw new Error('No se pudieron cargar los datos de acceso.');
                const data = await response.json();
                setLogs(data.logs || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setIsLoading(false);
            }
        };

        if(user?.role === 'ADMINISTRATOR') {
           fetchLogs();
        }

    }, [setPageTitle, user]);

    if (user?.role !== 'ADMINISTRATOR') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Esta sección es solo para administradores.</CardDescription>
          </CardHeader>
        </Card>
      )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">Auditoría de Seguridad Global</h2>
                    <p className="text-muted-foreground">Visualiza los eventos de acceso a la plataforma en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm"><div className="h-3 w-3 rounded-full bg-green-500"/><span>Acceso Exitoso</span></div>
                    <div className="flex items-center gap-1.5 text-sm"><div className="h-3 w-3 rounded-full bg-red-500"/><span>Intento Fallido</span></div>
                </div>
            </div>

            <Card className="h-[70vh] w-full">
                <CardContent className="p-0 h-full">
                    {isLoading ? (
                         <div className="flex h-full w-full items-center justify-center bg-muted/30"><Loader2 className="h-8 w-8 animate-spin"/></div>
                    ) : error ? (
                         <div className="flex h-full w-full items-center justify-center bg-destructive/10 text-destructive flex-col"><AlertTriangle className="h-8 w-8 mb-2"/><span>{error}</span></div>
                    ) : (
                        <GlobalAccessMap accessPoints={logs} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
