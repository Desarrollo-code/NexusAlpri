// src/components/analytics/security-charts.tsx
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Chrome, Apple, Monitor } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { IconBrandWindows } from '../icons/icon-brand-windows';
import { IconBrandLinux } from '../icons/icon-brand-linux';

const iconMap: Record<string, React.ElementType> = {
    'Chrome': Chrome,
    'Firefox': Monitor, 
    'Safari': Apple,
    'Edge': Monitor,
    'Windows': IconBrandWindows,
    'macOS': Apple,
    'Linux': IconBrandLinux,
    'Android': Monitor,
    'iOS': Apple,
};

const CustomYAxisTick = ({ y, payload }: any) => {
    const Icon = iconMap[payload.value] || Monitor;
    return (
        <g transform={`translate(0,${y})`}>
            <foreignObject x="-70" y="-8" width="60" height="16" className="text-right overflow-visible">
                <div className="flex items-center justify-end gap-1.5 w-full h-full">
                    <span className="text-xs text-muted-foreground truncate">{payload.value}</span>
                    <Icon className="h-3.5 w-3.5 text-foreground shrink-0" />
                </div>
            </foreignObject>
        </g>
    );
}

const chartConfig = {
    count: {
        label: "Cantidad",
    },
    Chrome: { color: "hsl(var(--chart-1))" },
    Windows: { color: "hsl(var(--chart-2))" },
    macOS: { color: "hsl(var(--chart-3))" },
    Android: { color: "hsl(var(--chart-4))" },
    Linux: { color: "hsl(var(--chart-5))" },
    Firefox: { color: "hsl(var(--chart-4))" },
    Safari: { color: "hsl(var(--chart-3))" },
    Edge: { color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

const Chart = ({ data }: { data: any[] }) => (
    <div className="h-24"> 
        {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 0, left: 70, bottom: 5 }} barSize={8} barGap={0}>
                    <XAxis type="number" hide />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={<CustomYAxisTick />}
                        width={80}
                        interval={0}
                    />
                    <Tooltip 
                        content={<ChartTooltipContent indicator="line" nameKey="name" labelKey="count" />}
                        cursor={{ fill: 'hsl(var(--muted))' }} 
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={cn(chartConfig[entry.name as keyof typeof chartConfig]?.color || 'hsl(var(--chart-1))')} />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
        ) : <p className="text-xs text-muted-foreground h-full flex items-center justify-center">No hay datos suficientes.</p>}
    </div>
);


export const DeviceDistributionChart = ({ browserData, osData }: { browserData: any[], osData: any[] }) => {
    return (
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    Distribución de Dispositivos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-medium text-sm mb-2">Navegadores</h4>
                    <Chart data={browserData} />
                </div>
                <Separator />
                <div>
                    <h4 className="font-medium text-sm mb-2">Sistemas Operativos</h4>
                    <Chart data={osData} />
                </div>
            </CardContent>
        </Card>
    );
};
