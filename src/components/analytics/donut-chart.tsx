// src/components/analytics/donut-chart.tsx
'use client';
import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Sector } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="currentColor" className="text-3xl font-bold fill-foreground">
        {value}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="currentColor" className="text-xs font-medium fill-muted-foreground uppercase tracking-wider">
        ({(percent * 100).toFixed(0)}%)
      </text>
      <text x={cx} y={cy + 35} textAnchor="middle" fill={fill} className="text-sm font-semibold italic">
        {payload.label}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-xl"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius - 1}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
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
      <Card className="h-full bg-white/40 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10" id={id}>
        <CardHeader><CardTitle className="text-lg font-semibold">{title}</CardTitle></CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Datos no disponibles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <Card className="h-full bg-white/60 dark:bg-black/60 backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden group hover:shadow-2xl" id={id}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ChartContainer config={config} className="w-full h-full">
            <ResponsiveContainer>
              <PieChart>
                <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent hideIndicator />} />
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={75}
                  outerRadius={95}
                  paddingAngle={5}
                  stroke="none"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  className="cursor-pointer"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.label}`}
                      fill={entry.fill}
                      className="transition-all duration-500 hover:opacity-80"
                      style={{ filter: `drop-shadow(0px 0px 8px ${entry.fill}44)` }}
                    />
                  ))}
                  {activeIndex === undefined && (
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="text-3xl font-bold fill-foreground">
                                {total.toLocaleString()}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="text-xs font-medium fill-muted-foreground uppercase tracking-widest">
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
        {/* Bottom indicator for active status */}
        <div className="flex justify-center gap-4 pb-4 px-4 overflow-x-auto">
          {data.map((entry, i) => (
            <div key={entry.label} className="flex items-center gap-1.5" onMouseEnter={() => setActiveIndex(i)}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-tighter truncate max-w-[80px] transition-colors",
                activeIndex === i ? "text-foreground" : "text-muted-foreground"
              )}>
                {entry.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
