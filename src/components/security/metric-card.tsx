// src/components/security/metric-card.tsx
'use client';
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";

export const MetricCard = ({ 
    id,
    title, 
    value, 
    icon: Icon, 
    onClick,
}: { 
    id: string;
    title: string; 
    value: number; 
    icon: React.ElementType; 
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);
    
    return (
        <Card 
            id={id} 
            className={cn(
                "group transition-all hover:border-primary/50 hover:shadow-lg relative overflow-hidden",
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{animatedValue}</div>
            </CardContent>
        </Card>
    );
};
