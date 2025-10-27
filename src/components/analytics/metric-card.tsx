// src/components/analytics/metric-card.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const MetricCard = ({ title, value, icon: Icon, description, suffix = '', gradient, color, trendData, dataKey, id, onClick }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    gradient: string,
    color?: string;
    trendData?: any[];
    dataKey?: string;
    id?: string;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value);
    return (
        <Card id={id} onClick={onClick} className={cn(
            "relative overflow-hidden text-white card-border-animated", 
            gradient,
            onClick && "cursor-pointer"
        )}>
            <div className="absolute inset-0 bg-black/10"></div>
             <CardHeader className="relative flex flex-row items-center justify-between space-y-0 p-3 pb-0">
                <CardTitle className="text-xs font-medium text-white/90">{title}</CardTitle>
                <Icon className="h-4 w-4 text-white/90" />
            </CardHeader>
            <CardContent className="relative p-3">
                <div className="text-2xl font-bold text-white">{animatedValue}{suffix}</div>
                {description && <p className="text-xs text-white/80">{description}</p>}
                {trendData && trendData.length > 0 && (
                     <div className="absolute bottom-[-28px] right-0 left-0 h-20 opacity-30">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="white" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="white" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey={dataKey || 'count'} stroke="white" strokeWidth={2} fill={`url(#gradient-${dataKey})`} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
