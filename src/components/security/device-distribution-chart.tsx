// src/components/security/device-distribution-chart.tsx
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Monitor, Chrome, Apple, HelpCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { IconBrandWindows } from '@/components/icons/icon-brand-windows';
import { IconBrandLinux } from '@/components/icons/icon-brand-linux';

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
    'Desconocido': HelpCircle,
};

const DataRow = ({ name, value, total }: { name: string, value: number, total: number }) => {
    const Icon = iconMap[name] || HelpCircle;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{name}</span>
                </div>
                <span className="font-semibold text-foreground">{percentage.toFixed(0)}%</span>
            </div>
            <Progress value={percentage} className="h-1"/>
        </div>
    )
}

const ChartSection = ({ title, data }: { title: string, data?: { name: string, count: number }[] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="w-1/2 flex-grow flex flex-col items-center justify-center">
                <h4 className="font-medium text-sm mb-2 self-start">{title}</h4>
                <p className="text-xs text-muted-foreground text-center flex-grow flex items-center justify-center">No hay datos.</p>
            </div>
        );
    }

    const total = data.reduce((acc, item) => acc + item.count, 0);

    return (
        <div className="w-1/2 flex-grow">
            <h4 className="font-medium text-sm mb-2">{title}</h4>
            <div className="space-y-2">
                {data.map(item => (
                    <DataRow key={item.name} name={item.name} value={item.count} total={total} />
                ))}
            </div>
        </div>
    );
};

export const DeviceDistributionChart = ({ browserData, osData }: { browserData?: any[], osData?: any[] }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    Distribución de Dispositivos
                </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
                <ChartSection title="Navegadores" data={browserData} />
                <Separator orientation="vertical" className="h-auto" />
                <ChartSection title="Sistemas Operativos" data={osData} />
            </CardContent>
        </Card>
    );
};
