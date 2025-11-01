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
                "relative text-white p-4 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.03] rounded-2xl h-28",
                gradient,
                onClick && "cursor-pointer"
            )}
        >
            <div className="flex justify-between items-start z-10">
                <p className="text-sm font-medium text-white/90">{title}</p>
                 <div className="h-8 w-8 flex items-center justify-center bg-white/20 rounded-full">
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>
            
            <div className="z-10 text-left">
                <p 
                    className="text-3xl font-bold text-white"
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
                >
                    {animatedValue}{suffix}
                </p>
                 {description && <p className="text-xs text-white/80">{description}</p>}
            </div>
        </Card>
    );
};
