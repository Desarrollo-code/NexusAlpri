// src/components/security/metric-card.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export const MetricCard = ({ 
    id,
    title, 
    value, 
    icon: Icon, 
    description, 
    suffix = '', 
    onClick,
    trendData
}: { 
    id: string;
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    onClick?: () => void;
    trendData?: { date: string, count: number }[];
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
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="z-10 relative">
                <div className="text-3xl font-bold text-foreground">{animatedValue}{suffix}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
            {trendData && trendData.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-2/3 opacity-30">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={trendData}
                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${id})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </Card>
    );
};
