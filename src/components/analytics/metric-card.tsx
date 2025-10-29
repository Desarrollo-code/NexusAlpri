// src/components/analytics/metric-card.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";

export const MetricCard = ({ title, value, icon: Icon, description, suffix = '', gradient, id, onClick }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    gradient: string,
    id?: string;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);

    return (
        <Card id={id} onClick={onClick} className={cn(
            "relative overflow-hidden text-white card-border-animated group", 
            gradient,
            "min-h-[120px] flex flex-col justify-between p-4", // Ajuste de padding y flex
            onClick && "cursor-pointer"
        )}>
            <div className="absolute inset-0 bg-black/10"></div>
            
            <div className="relative z-10 flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
                <Icon className="h-4 w-4 text-white/90" />
            </div>

            <div className="relative z-10 mt-auto">
                <div 
                    className="text-4xl md:text-5xl font-bold text-white" 
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.2)' }}
                >
                    {animatedValue}{suffix}
                </div>
                {description && <p className="text-xs text-white/80">{description}</p>}
            </div>
        </Card>
    );
};
