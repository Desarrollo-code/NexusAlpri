// src/components/analytics/metric-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter"
import { cn } from "@/lib/utils";
import React from "react";

export const MetricCard = ({ title, value, icon: Icon, description, suffix = '', gradient, id }: { title: string; value: number; icon: React.ElementType; description?: string; suffix?: string; gradient: string, id?: string }) => {
    const animatedValue = useAnimatedCounter(value);
    return (
        <Card id={id} className={cn("relative overflow-hidden text-white card-border-animated", gradient)}>
            <div className="absolute inset-0 bg-black/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
                <Icon className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent className="relative">
                <div className="text-3xl font-bold text-white">{animatedValue}{suffix}</div>
                {description && <p className="text-xs text-white/70">{description}</p>}
            </CardContent>
        </Card>
    );
};
