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
    const animatedValue = useAnimatedCounter(value, 0, 1000); // Duración más corta para números
    
    const chartConfig = dataKey ? { [dataKey]: { label: title } } : {};

    return (
        <Card id={id} onClick={onClick} className={cn(
            "relative overflow-hidden text-white card-border-animated group", 
            gradient,
            "min-h-[120px] flex flex-col justify-between", // Altura mínima y flex para distribuir
            onClick && "cursor-pointer"
        )}>
            <div className="absolute inset-0 bg-black/10"></div>
            
             <CardHeader className="relative flex flex-row items-center justify-between space-y-0 p-3 pb-0 z-10">
                <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
                <Icon className="h-4 w-4 text-white/90" />
            </CardHeader>

            <CardContent className="relative p-3 z-10">
                <div 
                    className="text-3xl md:text-4xl font-bold text-white" 
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.2)' }}
                >
                    {animatedValue}{suffix}
                </div>
                {description && <p className="text-xs text-white/80">{description}</p>}
            </CardContent>
            
            {trendData && trendData.length > 0 && dataKey && (
                 <div className="absolute bottom-0 right-0 left-0 h-20 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
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
                              content={<ChartTooltipContent indicator="line" hideLabel hideIndicator className="!p-1 !text-xs"/>}
                            />
                            <Area type="monotone" dataKey={dataKey} stroke="rgba(255,255,255,0.8)" strokeWidth={2} fillOpacity={0.4} fill={`url(#gradient-${dataKey})`} />
                        </AreaChart>
                    </ChartContainer>
                </div>
            )}
        </Card>
    );
};
