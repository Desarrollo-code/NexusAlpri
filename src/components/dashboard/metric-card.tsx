// src/components/dashboard/metric-card.tsx
// This file is obsolete. The new metric card is located at /src/components/analytics/metric-card.tsx
// This file can be deleted.
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";

interface MetricCardProps { 
    id?: string;
    title: string; 
    value: number; 
    icon: React.ElementType; 
    onClick?: () => void;
    description?: string;
    suffix?: string;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
    ({ id, title, value, icon: Icon, onClick, description, suffix }, ref) => {
    const animatedValue = useAnimatedCounter(value || 0);
    
    return (
        <Card 
            id={id} 
            ref={ref}
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
                <div className="text-2xl font-bold">{animatedValue}{suffix}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
});

MetricCard.displayName = "MetricCard";

export { MetricCard };
