// src/components/analytics/security-charts.tsx
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
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{name}</span>
                </div>
                <span className="font-semibold text-foreground">{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={percentage} className="h-1.5"/>
        </div>
    )
}

const ChartSection = ({ title, data }: { title: string, data: any[]}) => {
    const total = data.reduce((acc, item) => acc + item.count, 0);

    return (
        <div>
            <h4 className="font-medium text-sm mb-3">{title}</h4>
            <div className="space-y-3">
                 {data.length > 0 ? data.map(item => (
                    <DataRow key={item.name} name={item.name} value={item.count} total={total} />
                )) : <p className="text-xs text-muted-foreground text-center py-2">No hay datos suficientes.</p>}
            </div>
        </div>
    );
};

export const DeviceDistributionChart = ({ browserData, osData }: { browserData: any[], osData: any[] }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    Distribución de Dispositivos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <ChartSection title="Navegadores" data={browserData} />
                <Separator />
                <ChartSection title="Sistemas Operativos" data={osData} />
            </CardContent>
        </Card>
    );
};
