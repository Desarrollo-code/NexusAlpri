// src/components/security/metric-card.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const MetricCard = ({ 
    id,
    title, 
    value, 
    icon: Icon, 
    description, 
    suffix = '', 
    gradient,
    trendData,
    dataKey = 'count',
    onClick
}: { 
    id: string;
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    gradient: string;
    trendData?: any[];
    dataKey?: string;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value);
    
    return (
        <Card 
            id={id} 
            className={cn(
                "relative overflow-hidden text-white card-border-animated", 
                gradient,
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-black/10"></div>
             <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
                <Icon className="h-5 w-5 text-white/90" />
            </CardHeader>
            <CardContent className="relative">
                <div className="text-3xl font-bold text-white">{animatedValue}{suffix}</div>
                {description && <p className="text-xs text-white/80">{description}</p>}
                {trendData && trendData.length > 0 && (
                     <div className="absolute bottom-[-32px] right-0 left-0 h-24 opacity-30">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="white" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="white" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey={dataKey} stroke="white" strokeWidth={2} fill={`url(#gradient-${dataKey})`} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
