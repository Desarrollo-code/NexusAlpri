// src/components/analytics/donut-chart.tsx
'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Sector } from "recharts";

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 10) * cos;
  const my = cy + (outerRadius + 10) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 11;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g className="transition-transform duration-300 ease-in-out transform-gpu">
      <text x={cx} y={cy} dy={4} textAnchor="middle" fill={fill} className="text-base font-bold">
        {payload.label}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={1}
        className="transition-all duration-300"
      />
       <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
       <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
       <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 8} dy="-0.5em">{value}</tspan>
         <tspan x={ex + (cos >= 0 ? 1 : -1) * 8} dy="1em">{`(${(percent * 100).toFixed(0)}%)`}</tspan>
      </text>
    </g>
  );
};

export function DonutChart({ title, data, config, id }: { title: string, data: any[], config: ChartConfig, id?: string }) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  const onPieLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, [setActiveIndex]);

  if (!data || data.length === 0) {
    return (
        <Card className="h-full" id={id}>
             <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
             <CardContent className="h-80 flex items-center justify-center">
                 <p className="text-sm text-muted-foreground">Datos no disponibles.</p>
             </CardContent>
        </Card>
    );
  }
  
  return (
    <Card className="h-full" id={id}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie 
                data={data} 
                dataKey="count" 
                nameKey="label" 
                innerRadius={90} 
                outerRadius={110}
                strokeWidth={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                className="cursor-pointer"
                background={<Sector cx={195} cy={160} innerRadius={90} outerRadius={110} fill="hsl(var(--muted-foreground)/20)" />}
              >
                 {data.map((entry) => (
                    <Cell key={`cell-${entry.label}`} fill={entry.fill} />
                  ))}
                 {activeIndex === undefined && (
                    <Label
                        content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                        <tspan x={viewBox.cx} y={viewBox.cy} className="text-2xl font-bold fill-foreground">
                                            {total.toLocaleString()}
                                        </tspan>
                                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="text-xs fill-muted-foreground">
                                            Total
                                        </tspan>
                                    </text>
                                );
                            }
                        }}
                    />
                 )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
