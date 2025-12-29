// src/components/analytics/vertical-bar-chart.tsx
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

type Row = {
  label: string;
  count: number;
  fill?: string;
  role?: string;
};

export function VerticalBarChart({ title = 'Distribución', data = [] as Row[] }: { title?: string; data: Row[] }) {
  const total = useMemo(() => data.reduce((s, d) => s + (d.count || 0), 0), [data]);

  const tooltipFormatter = (value: number, name: string, props: any) => {
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return [
      <div className="text-sm">
        <div className="font-semibold">{props.payload?.label || name}</div>
        <div className="text-xs text-muted-foreground">Cantidad: {value}</div>
        <div className="text-xs text-muted-foreground">Porcentaje: {percent}%</div>
      </div>,
      ''
    ];
  };

  return (
    <Card className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 p-4">
        <ChartContainer className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                {/* small gradient for bars */}
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.06} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis allowDecimals={false} width={36} axisLine={false} tickLine={false} />
              <Tooltip wrapperStyle={{ outline: 'none' }} cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: 8 }} formatter={tooltipFormatter} />
              <Bar dataKey="count" name="Usuarios" radius={[6,6,0,0]} barSize={28}>
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.fill || 'url(#barGrad)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default VerticalBarChart;
