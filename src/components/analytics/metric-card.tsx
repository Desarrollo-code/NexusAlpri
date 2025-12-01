// src/components/analytics/metric-card.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
    
    // Asigna un color de la paleta de gráficos de forma rotativa
    const colorVar = `--chart-${(index % 5) + 1}`;
    
    return (
        <Card 
            onClick={onClick} 
            className={cn(
                "relative text-primary-foreground p-4 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl overflow-hidden h-full",
                onClick && "cursor-pointer"
            )}
            style={{ backgroundColor: `hsl(var(${colorVar}))` }}
        >
             <div className="flex justify-between items-start text-primary-foreground/80">
                <p className="text-sm font-semibold">{title}</p>
                <Icon className="h-5 w-5" />
            </div>
            
            <div className="text-left">
                <p className="text-3xl font-bold tracking-tighter text-primary-foreground">
                    {animatedValue}{suffix}
                </p>
                {description && <p className="text-xs text-primary-foreground/70">{description}</p>}
            </div>
        </Card>
    );
};
