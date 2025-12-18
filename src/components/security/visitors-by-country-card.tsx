// src/components/security/visitors-by-country-card.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Globe } from 'lucide-react';
import { DecorativeHeaderBackground } from '../layout/decorative-header-background';

interface VisitorsByCountryCardProps {
    isLoading: boolean;
}

export const VisitorsByCountryCard = ({ isLoading }: VisitorsByCountryCardProps) => {
    const { settings } = useAuth();
    
    return (
        <Card className="relative overflow-hidden">
             <div className="absolute inset-0">
                <DecorativeHeaderBackground />
             </div>
             <div className="relative z-10 p-4 flex flex-col items-center justify-center text-center h-full">
                <div className="w-40 h-40">
                    {isLoading ? (
                        <Skeleton className="w-full h-full" />
                    ) : settings?.securityAuditImageUrl ? (
                        <Image 
                            src={settings.securityAuditImageUrl} 
                            alt="Mascota de Seguridad" 
                            fill 
                            className="object-contain p-2"
                            data-ai-hint="security audit illustration"
                        />
                    ) : (
                        <div className="text-center text-muted-foreground p-2">
                           <Globe className="mx-auto h-16 w-16"/>
                        </div>
                    )}
                </div>
                <CardHeader className="p-0 pt-2">
                    <CardTitle>Monitoreo Global</CardTitle>
                </CardHeader>
            </div>
        </Card>
    );
};
