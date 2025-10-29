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
                "relative text-white p-4 flex items-center justify-between transition-transform duration-300 hover:scale-[1.03]",
                gradient,
                onClick && "cursor-pointer"
            )}
        >
            <div className="z-10">
                <p 
                    className="text-4xl md:text-5xl font-bold text-white"
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.2)' }}
                >
                    {animatedValue}{suffix}
                </p>
                <p className="text-sm font-medium text-white/90 mt-1">{title}</p>
                 {description && <p className="text-xs text-white/80">{description}</p>}
            </div>
            
            <div className="relative z-10 h-14 w-14 flex items-center justify-center bg-white/20 rounded-full">
                <Icon className="h-7 w-7 text-white" />
            </div>
        </Card>
    );
};
