// src/components/security/info-mascot-card.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export const InfoMascotCard = () => {
    const { settings } = useAuth();
    
    const mascotUrl = settings?.securityMascotUrl || "https://placehold.co/150x150/6366f1/ffffff?text=🦉";

    return (
        <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                         <Image
                            src={mascotUrl}
                            alt="Mascota de seguridad"
                            width={100}
                            height={100}
                            className="object-contain"
                            data-ai-hint="security mascot owl"
                         />
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                             <Lightbulb className="h-4 w-4 text-primary"/>
                            ¿Por qué es importante saber estos datos?
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Analizar estos registros te ayuda a detectar patrones sospechosos, entender cómo acceden tus usuarios y fortalecer la seguridad general de tu plataforma.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
