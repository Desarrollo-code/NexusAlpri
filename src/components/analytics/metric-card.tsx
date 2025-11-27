// src/components/analytics/metric-card.tsx
'use client';
import { Card } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";

// CORRECCIÓN: Usar clases que hacen referencia a las variables de color del tema de Tailwind.
const CHART_COLORS = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
];


export const MetricCard = ({ title, value, icon: Icon, description, suffix = '', index = 0, onClick }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    index?: number;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);
    
    // Asigna un color del tema basado en el índice de la tarjeta.
    const colorClass = CHART_COLORS[index % CHART_COLORS.length];

    return (
        <Card 
            onClick={onClick} 
            className={cn(
                "relative text-primary-foreground p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl rounded-2xl h-28 overflow-hidden border-0",
                colorClass,
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex justify-between items-start z-10">
                <p className="text-sm font-semibold">{title}</p>
                <Icon className="h-5 w-5 text-white/80" />
            </div>
            
            <div className="z-10 text-left">
                <p className="text-4xl font-bold tracking-tighter">
                    {animatedValue}{suffix}
                </p>
                 {description && <p className="text-xs text-white/80">{description}</p>}
            </div>
        </Card>
    );
};
