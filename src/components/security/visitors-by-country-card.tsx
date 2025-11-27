// src/components/security/visitors-by-country-card.tsx
'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface VisitorsByCountryCardProps {
    isLoading: boolean;
    imageUrl?: string; // Prop opcional para la imagen de fondo
}

export const VisitorsByCountryCard = ({ isLoading, imageUrl }: VisitorsByCountryCardProps) => {
    return (
        <Card className="relative bg-gradient-to-r from-purple-500 to-blue-500 text-white overflow-hidden h-40">
            <CardContent className="p-0 h-full">
                {isLoading ? (
                    <Skeleton className="w-full h-full bg-white/20" />
                ) : (
                    <div className="w-full h-full">
                        {/* 
                          AQUÍ PUEDES AÑADIR TU IMAGEN DE FONDO. 
                          Idealmente, la URL de la imagen vendría de la configuración.
                          Ejemplo:
                          <Image 
                            src={imageUrl || "/placeholder.jpg"} 
                            alt="Mapa de visitantes" 
                            fill 
                            className="object-cover opacity-30"
                          />
                        */}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
