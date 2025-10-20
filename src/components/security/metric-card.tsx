// src/components/security/metric-card.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";

export const MetricCard = ({ 
    id,
    title, 
    value, 
    icon: Icon, 
    description, 
    suffix = '', 
    onClick
}: { 
    id: string;
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value);
    
    return (
        <Card 
            id={id} 
            className={cn(
                "relative overflow-hidden text-foreground card-border-animated bg-card", 
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-foreground">{animatedValue}{suffix}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
};
