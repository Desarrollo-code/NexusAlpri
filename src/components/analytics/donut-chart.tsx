'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Sector } from "recharts";

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="hsl(var(--foreground))" className="text-2xl font-bold">
        {value}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm">
        ({(percent * 100).toFixed(0)}%)
      </text>
       <text x={cx} y={cy + 30} textAnchor="middle" fill={fill} className="text-base font-semibold">
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
        strokeWidth={2}
        className="transition-all duration-300 drop-shadow-lg"
      />
    </g>
  );
};

export function DonutChart({ title, data, config, id }: { title: string, data: any[], config: ChartConfig, id?: string }) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.count, 0), [data]);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(0);
  
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
        <CardTitle className="text-base flex items-center gap-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ChartContainer config={config} className="w-full h-full">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Pie 
                data={data} 
                dataKey="count" 
                nameKey="label" 
                innerRadius={70} 
                outerRadius={90}
                strokeWidth={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                className="cursor-pointer drop-shadow-lg"
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
