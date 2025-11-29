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
            <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
                 <div className="col-span-1">
                    <CardHeader className="p-0">
                        <CardTitle className="text-base">Imagen de Auditoría</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            Visual que acompaña el panel de seguridad, aportando un elemento de identidad y profesionalismo a la sección de auditoría.
                        </CardDescription>
                    </CardHeader>
                </div>
                <div className="col-span-2 w-full aspect-video relative bg-muted/50 rounded-lg flex items-center justify-center">
                {isLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : settings?.securityAuditImageUrl ? (
                    <Image 
                        src={settings.securityAuditImageUrl} 
                        alt="Imagen de Auditoría de Seguridad" 
                        fill 
                        className="object-contain p-2"
                        data-ai-hint="security audit illustration"
                    />
                ) : (
                    <div className="text-center text-muted-foreground p-2">
                       <Globe className="mx-auto h-8 w-8"/>
                       <p className="mt-1 text-xs">Sin imagen</p>
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
    );
};
