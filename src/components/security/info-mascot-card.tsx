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
                <div className="flex flex-col items-center gap-4">
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
                    <div className="flex-grow space-y-3">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                             <Lightbulb className="h-4 w-4 text-primary"/>
                            ¿Por qué es importante saber estos datos?
                        </p>
                        <p className="text-xs text-muted-foreground">
                            ¡Hola! Soy tu asistente de seguridad. Te explico qué significa todo esto:
                        </p>
                        <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
                            <li><strong>Línea de Tiempo:</strong> Es como la cámara de seguridad. Registra cada vez que alguien intenta entrar, cambia su contraseña o se le asigna un nuevo rol.</li>
                            <li><strong>Dispositivos:</strong> Te dice desde qué tipo de aparatos (celulares, computadores) y navegadores (Chrome, Safari) se conectan. Si de repente ves accesos desde un dispositivo raro, es una señal de alerta.</li>
                            <li><strong>Salud de Seguridad:</strong> Es un "termómetro". Un puntaje alto significa que la mayoría de los intentos de inicio de sesión son exitosos y de usuarios conocidos.</li>
                            <li><strong>Top IPs:</strong> Una "IP" es como la "dirección de internet" desde donde alguien se conecta. Si ves muchas conexiones desde una ubicación extraña, es bueno investigarlo.</li>
                        </ul>
                         <p className="text-xs text-muted-foreground pt-2">
                           En resumen, esta pantalla te da las herramientas para ser el guardián de la plataforma.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
