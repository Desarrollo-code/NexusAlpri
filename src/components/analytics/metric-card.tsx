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
    gradient
}: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    index?: number;
    onClick?: () => void;
    gradient?: string;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);
    
    const colorVar = `--chart-${(index % 5) + 1}`;
    
    return (
        <Card 
            onClick={onClick} 
            className={cn(
                "relative text-primary-foreground p-3 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-xl overflow-hidden h-full",
                onClick && "cursor-pointer",
                gradient ? gradient : 'bg-primary'
            )}
            style={!gradient ? { backgroundColor: `hsl(var(${colorVar}))` } : {}}
        >
             <div className="flex justify-between items-start text-primary-foreground/80">
                <p className="text-base font-semibold">{title}</p>
                {Icon && <Icon className="h-7 w-7 md:h-8 md:w-8" />}
            </div>
            
            <div className="text-left mt-2">
                <p className="text-4xl font-bold tracking-tighter text-primary-foreground">
                    {animatedValue}{suffix}
                </p>
                {description && <p className="text-xs text-primary-foreground/70">{description}</p>}
            </div>
        </Card>
    );
};
