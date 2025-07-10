
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, ShieldAlert, ShieldX, ShieldCheck, KeyRound, UserRound, Server, UserCog } from 'lucide-react';
import type { SecurityLog as AppSecurityLog, SecurityLogEvent, User as AppUser } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface SecurityLogWithUser extends AppSecurityLog {
  user: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

export default function SecurityAuditPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [logs, setLogs] = useState<SecurityLogWithUser[]>([]);
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
            const data: { logs: SecurityLogWithUser[] } = await response.json();
            setLogs(data.logs || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error fetching logs');
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not load security logs.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (currentUser?.role !== 'ADMINISTRATOR') {
            router.push('/dashboard');
            return;
        }
        fetchLogs();
    }, [currentUser, router, fetchLogs]);

    const getEventDetails = (event: SecurityLogEvent, details?: string | null) => {
        switch (event) {
            case 'SUCCESSFUL_LOGIN':
                 return {
                    label: 'Inicio de Sesión Exitoso',
                    icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
                    variant: 'secondary',
                    details: 'Acceso concedido a la cuenta.'
                };
            case 'FAILED_LOGIN_ATTEMPT':
                return {
                    label: 'Intento de Inicio Fallido',
                    icon: <ShieldX className="h-4 w-4 text-destructive" />,
                    variant: 'destructive',
                    details: 'Credenciales incorrectas o usuario no encontrado.'
                };
            case 'PASSWORD_CHANGE_SUCCESS':
                 return {
                    label: 'Cambio de Contraseña',
                    icon: <KeyRound className="h-4 w-4 text-blue-500" />,
                    variant: 'default',
                    details: 'La contraseña del usuario fue actualizada.'
                };
            case 'TWO_FACTOR_ENABLED':
                return {
                    label: '2FA Activado',
                    icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
                    variant: 'default',
                    details: 'El usuario activó la autenticación de dos factores.'
                };
            case 'TWO_FACTOR_DISABLED':
                return {
                    label: '2FA Desactivado',
                    icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
                    variant: 'destructive',
                    variant_opts: { className: 'bg-amber-500 hover:bg-amber-600 border-amber-500' },
                    details: 'El usuario desactivó la autenticación de dos factores.'
                };
             case 'USER_ROLE_CHANGED':
                return {
                    label: 'Cambio de Rol de Usuario',
                    icon: <UserCog className="h-4 w-4 text-purple-500" />,
                    variant: 'default',
                    variant_opts: { className: 'bg-purple-600 hover:bg-purple-700 border-purple-600' },
                    details: details || 'El rol del usuario ha sido modificado.'
                };
            default:
                return {
                    label: event.replace(/_/g, ' ').toLowerCase(),
                    icon: <ShieldAlert className="h-4 w-4 text-muted-foreground" />,
                    variant: 'outline',
                    details: details || 'Evento de seguridad general.'
                };
        }
    };
    
    const getInitials = (name?: string | null) => {
        if (!name) return '??';
        const names = name.split(' ');
        if (names.length > 1 && names[0] && names[names.length - 1]) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        if (names.length === 1 && names[0]) return names[0].substring(0, 2).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };


    if (currentUser?.role !== 'ADMINISTRATOR') {
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
                                        <TableHead className="w-[200px]">Evento</TableHead>
                                        <TableHead>Detalles</TableHead>
                                        <TableHead>Usuario Afectado</TableHead>
                                        <TableHead>Dirección IP</TableHead>
                                        <TableHead className="text-right">Fecha y Hora</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => {
                                            const eventDetails = getEventDetails(log.event, log.details);
                                            return (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {eventDetails.icon}
                                                            <Badge variant={eventDetails.variant} {...(eventDetails.variant_opts || {})}>
                                                                {eventDetails.label}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{eventDetails.details}</TableCell>
                                                     <TableCell>
                                                        {log.user ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={log.user.avatar || undefined} alt={log.user.name || 'User'} />
                                                                    <AvatarFallback>{getInitials(log.user.name)}</AvatarFallback>
                                                                </Avatar>
                                                                <Link href={`/users/${log.user.id}`} className="font-medium hover:underline">{log.user.name}</Link>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                               <div className="h-8 w-8 flex items-center justify-center rounded-full bg-muted"><UserRound className="h-4 w-4"/></div>
                                                                <span className="text-xs font-mono">{log.emailAttempt || 'Desconocido'}</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 font-mono text-xs">
                                                            <Server className="h-4 w-4 text-muted-foreground"/>
                                                            {log.ipAddress}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{new Date(log.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
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
