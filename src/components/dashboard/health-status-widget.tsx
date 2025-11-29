// src/components/dashboard/health-status-widget.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Database, Server } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = 'loading' | 'healthy' | 'error';

const StatusIndicator = ({ status }: { status: Status }) => {
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className={cn(
                "h-3 w-3 rounded-full animate-pulse",
                status === 'healthy' && "bg-green-500",
                status === 'error' && "bg-red-500",
                status === 'loading' && "bg-yellow-500"
            )} />
            <span className={cn(
                "font-semibold",
                 status === 'healthy' && "text-green-600",
                 status === 'error' && "text-red-600",
                 status === 'loading' && "text-yellow-600"
            )}>
                {status === 'healthy' ? 'Operacional' : status === 'error' ? 'Error' : 'Verificando...'}
            </span>
        </div>
    )
}

export function HealthStatusWidget() {
    const [apiStatus, setApiStatus] = useState<Status>('loading');
    const [dbStatus, setDbStatus] = useState<Status>('loading');

    useEffect(() => {
        const checkStatus = async () => {
            // Check API health
            try {
                const apiRes = await fetch('/api/health');
                const apiData = await apiRes.json();
                setApiStatus(apiRes.ok ? 'healthy' : 'error');
                setDbStatus(apiData.db === 'connected' ? 'healthy' : 'error');
            } catch (error) {
                setApiStatus('error');
                setDbStatus('error');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Check every 60 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Salud de la Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-muted-foreground"/>
                        <span className="font-medium">API del Servidor</span>
                    </div>
                    <StatusIndicator status={apiStatus} />
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-muted-foreground"/>
                        <span className="font-medium">Base de Datos</span>
                    </div>
                    <StatusIndicator status={dbStatus} />
                </div>
            </CardContent>
        </Card>
    );
}
