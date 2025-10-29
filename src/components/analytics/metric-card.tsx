// src/components/analytics/metric-card.tsx
'use client';
import { Card } from "@/components/ui/card"
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
        <Card 
            id={id} 
            onClick={onClick} 
            className={cn(
                "relative text-white p-4 flex items-center justify-between transition-transform duration-300 hover:scale-[1.03] rounded-2xl",
                gradient,
                onClick && "cursor-pointer"
            )}
        >
            <div className="z-10">
                <p 
                    className="text-3xl font-bold text-white"
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
                >
                    {animatedValue}{suffix}
                </p>
                <p className="text-sm font-medium text-white/90">{title}</p>
                 {description && <p className="text-xs text-white/80">{description}</p>}
            </div>
            
            <div className="relative z-10 h-12 w-12 flex items-center justify-center bg-white/20 rounded-full">
                <Icon className="h-6 w-6 text-white" />
            </div>
        </Card>
    );
};
