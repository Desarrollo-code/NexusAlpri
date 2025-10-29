// src/components/analytics/metric-card.tsx
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export const MetricCard = ({ title, value, icon: Icon, description, suffix = '', gradient, trendData, dataKey, id, onClick }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    description?: string; 
    suffix?: string; 
    gradient: string,
    trendData?: any[];
    dataKey?: string;
    id?: string;
    onClick?: () => void;
}) => {
    const animatedValue = useAnimatedCounter(value);
    
    // Crear una configuración de chart simple para el tooltip
    const chartConfig = dataKey ? { [dataKey]: { label: title } } : {};

    return (
        <Card id={id} onClick={onClick} className={cn(
            "relative overflow-hidden text-white card-border-animated group", 
            gradient,
            onClick && "cursor-pointer"
        )}>
            <div className="absolute inset-0 bg-black/10"></div>
             <CardHeader className="relative flex flex-row items-center justify-between space-y-0 p-3 pb-0">
                <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
                <Icon className="h-4 w-4 text-white/90" />
            </CardHeader>
            <CardContent className="relative p-3">
                <div className="text-2xl md:text-3xl font-bold text-white">{animatedValue}{suffix}</div>
                {description && <p className="text-xs text-white/80">{description}</p>}
                {trendData && trendData.length > 0 && dataKey && (
                     <div className="absolute bottom-[-10px] right-0 left-0 h-16 opacity-0 group-hover:opacity-30 group-hover:bottom-0 transition-all duration-300">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                               <defs>
                                    <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="white" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="white" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                  cursor={false}
                                  content={<ChartTooltipContent indicator="line" hideLabel hideIndicator />}
                                />
                                <Area type="monotone" dataKey={dataKey} stroke="rgba(255,255,255,0.8)" strokeWidth={2} fillOpacity={0.4} fill={`url(#gradient-${dataKey})`} />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
