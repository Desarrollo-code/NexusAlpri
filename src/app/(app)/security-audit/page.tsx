
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldAlert, ShieldX } from 'lucide-react';
import type { SecurityLog } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function SecurityAuditPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/security/logs');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch security logs');
            }
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching logs');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not load security logs.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (user?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchLogs();
    }, [user, router, fetchLogs]);

    const getEventDetails = (event: SecurityLog['event']) => {
        switch (event) {
            case 'FAILED_LOGIN_ATTEMPT':
                return {
                    label: 'Intento de Inicio de Sesión Fallido',
                    icon: <ShieldX className="h-4 w-4 text-destructive" />,
                    variant: 'destructive',
                };
            // Add other event types here in the future
            default:
                return {
                    label: event.replace(/_/g, ' ').toLowerCase(),
                    icon: <ShieldAlert className="h-4 w-4 text-muted-foreground" />,
                    variant: 'secondary',
                };
        }
    };

    if (user?.role !== 'ADMINISTRATOR') {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline mb-2">Auditoría de Seguridad</h1>
                <p className="text-muted-foreground">Revisa los eventos de seguridad importantes de la plataforma.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Últimos Eventos de Seguridad</CardTitle>
                    <CardDescription>Mostrando los últimos 100 eventos registrados.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">Cargando registros...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-destructive">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p className="font-semibold">{error}</p>
                            <Button onClick={fetchLogs} variant="outline" className="mt-4">
                                Reintentar
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Evento</TableHead>
                                        <TableHead>Email (Intento)</TableHead>
                                        <TableHead>Dirección IP</TableHead>
                                        <TableHead>Fecha y Hora</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => {
                                            const eventDetails = getEventDetails(log.event);
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {eventDetails.icon}
                                                            <Badge variant={eventDetails.variant} className="capitalize">
                                                                {eventDetails.label}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{log.emailAttempt || 'N/A'}</TableCell>
                                                    <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                                                    <TableCell>{new Date(log.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                No hay registros de seguridad.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
