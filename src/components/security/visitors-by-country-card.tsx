// src/components/security/visitors-by-country-card.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';

interface VisitorsByCountryCardProps {
    topCountries?: { name: string; count: number }[];
    isLoading: boolean;
}

const StatDisplay = ({ label, value }: { label: string, value: number }) => {
    const animatedValue = useAnimatedCounter(value);
    return (
        <div className="text-right">
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="text-2xl font-bold text-white">{animatedValue}</p>
        </div>
    )
};

export const VisitorsByCountryCard = ({ topCountries, isLoading }: VisitorsByCountryCardProps) => {
    return (
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white overflow-hidden">
            <CardContent className="p-0 flex flex-col md:flex-row">
                 <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                    {isLoading ? (
                        <Skeleton className="w-24 h-24 rounded-full bg-white/20" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                            <Globe className="h-12 w-12 text-white/80" />
                        </div>
                    )}
                     <h3 className="font-bold text-lg mt-2">Visitantes por País</h3>
                </div>
                <div className="flex-shrink-0 md:w-48 bg-black/10 p-4 flex flex-col justify-center gap-4">
                     {isLoading ? (
                        <>
                           <div className="space-y-1 text-right"><Skeleton className="h-4 w-20 ml-auto bg-white/20"/><Skeleton className="h-7 w-16 ml-auto bg-white/20"/></div>
                           <div className="space-y-1 text-right"><Skeleton className="h-4 w-16 ml-auto bg-white/20"/><Skeleton className="h-7 w-12 ml-auto bg-white/20"/></div>
                        </>
                    ) : topCountries && topCountries.length > 0 ? (
                       <>
                         <StatDisplay label={topCountries[0].name} value={topCountries[0].count} />
                         {topCountries[1] && <StatDisplay label={topCountries[1].name} value={topCountries[1].count} />}
                       </>
                    ) : (
                        <p className="text-sm text-center text-white/80">No hay datos de ubicación.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
