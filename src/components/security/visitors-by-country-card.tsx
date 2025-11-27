// src/components/security/visitors-by-country-card.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Globe } from 'lucide-react';

interface VisitorsByCountryCardProps {
    isLoading: boolean;
}

export const VisitorsByCountryCard = ({ isLoading }: VisitorsByCountryCardProps) => {
    const { settings } = useAuth();
    
    return (
        <Card>
             <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">Imagen de Auditoría</CardTitle>
                <CardDescription className="text-xs">
                    Una imagen temática para esta sección. Puedes cambiarla en la configuración de apariencia.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
                <div className="w-full aspect-square relative bg-muted/50 rounded-lg flex items-center justify-center">
                {isLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : settings?.securityAuditImageUrl ? (
                    <Image 
                        src={settings.securityAuditImageUrl} 
                        alt="Imagen de Auditoría de Seguridad" 
                        fill 
                        className="object-contain p-4"
                        data-ai-hint="security audit illustration"
                    />
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                       <Globe className="mx-auto h-12 w-12"/>
                       <p className="mt-2 text-sm">Sube una imagen para esta sección.</p>
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
    );
};
