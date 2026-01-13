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
  const total = useMemo(() => (data || []).reduce((s, d) => s + (d.count || 0), 0), [data]);

  // Build a safe ChartConfig for ChartContainer so ChartStyle/Object.entries never receives undefined
  const config = useMemo(() => {
    const cfg: Record<string, { label?: string; color?: string }> = {};
    (data || []).forEach((d, i) => {
      const key = (d.role || d.label || `key${i}`).toString();
      cfg[key] = { label: d.label || key, color: d.fill || 'hsl(var(--chart-1))' };
    });
    return cfg;
  }, [data]);

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
    <div className="w-full h-full">
      <ChartContainer className="w-full h-full" config={config}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.9} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
            <YAxis allowDecimals={false} width={40} axisLine={false} tickLine={false} fontSize={10} />
            <Tooltip wrapperStyle={{ outline: 'none' }} cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: 6, fontSize: '10px' }} formatter={tooltipFormatter} />
            <Bar dataKey="count" name="Usuarios" radius={[4, 4, 0, 0]} barSize={24}>
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill || 'url(#barGrad)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export default VerticalBarChart;
