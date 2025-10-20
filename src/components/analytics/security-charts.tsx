// src/components/analytics/security-charts.tsx
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Chrome, Apple, Monitor, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const iconMap: Record<string, React.ElementType> = {
    'Chrome': Chrome,
    'Firefox': Globe, 
    'Safari': Globe,
    'Edge': Globe,
    'Windows': Monitor,
    'macOS': Apple,
    'Linux': Monitor,
    'Android': Monitor,
    'iOS': Apple,
};

const CustomYAxisTick = ({ y, payload }: any) => {
    const Icon = iconMap[payload.value] || Monitor;
    // Ajustamos la posición vertical para centrar el icono y el texto
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

const Chart = ({ data, config }: { data: any[], config: ChartConfig }) => (
    <div className="h-24"> 
        {data.length > 0 ? (
            <ChartContainer config={config} className="w-full h-full">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 0, left: 70, bottom: 5 }} barCategoryGap={0}>
                    <XAxis type="number" hide />
                    <YAxis 
                        type="category" 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={<CustomYAxisTick />}
                        width={80} // Damos espacio suficiente para el tick
                        interval={0}
                    />
                    <Tooltip 
                        content={<ChartTooltipContent />} 
                        cursor={{ fill: 'hsl(var(--muted))' }} 
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={8}>
                        {data.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={`var(--color-${entry.name})`} />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
        ) : <p className="text-xs text-muted-foreground h-full flex items-center justify-center">No hay datos suficientes.</p>}
    </div>
);


export const DeviceDistributionChart = ({ browserData, osData }: { browserData: any[], osData: any[] }) => {
    const chartConfig: ChartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        [...browserData, ...osData].forEach((item, index) => {
            config[item.name] = {
                color: `hsl(var(--chart-${(index % 5) + 1}))`
            }
        });
        return config;
    }, [browserData, osData]);

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
                    <Chart data={browserData} config={chartConfig} />
                </div>
                <Separator />
                <div>
                    <h4 className="font-medium text-sm mb-2">Sistemas Operativos</h4>
                    <Chart data={osData} config={chartConfig} />
                </div>
            </CardContent>
        </Card>
    );
};
