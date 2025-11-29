
      
// src/components/analytics/metric-card.tsx
'use client';
import { Card } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";

export const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    suffix = '', 
    index = 0, 
    onClick, 
}: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    index?: number;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);
    
    // Asigna un color de la paleta de gráficos del tema.
    const colorVar = `--chart-${(index % 5) + 1}`;
    
    return (
        <Card 
            onClick={onClick} 
            className={cn(
                "relative text-white p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl rounded-2xl h-28 overflow-hidden border-0",
                onClick && "cursor-pointer"
            )}
            style={{ backgroundColor: `hsl(var(${colorVar}))` }}
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

    