// src/components/analytics/donut-chart.tsx
 'use client';
import React, { useMemo, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart, ResponsiveContainer, Cell, Label, Sector } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  // Only render the highlighted slice visuals (no central text) to avoid
  // duplicating the label/total rendered by the Pie's <Label />.
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-xl"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={Math.max(0, innerRadius - 4)}
        outerRadius={innerRadius - 1}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export function DonutChart({ title, data, config, id }: { title: string, data: any[], config: ChartConfig, id?: string }) {
  const initialKeys = useMemo(() => data.map(d => d.label), [data]);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(initialKeys);
  const [hoverIndex, setHoverIndex] = useState<number | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(undefined);

  const filteredData = useMemo(() => data.filter(d => visibleKeys.includes(d.label)), [data, visibleKeys]);
  const total = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.count, 0), [filteredData]);

  const onToggleKey = useCallback((label: string) => {
    setVisibleKeys(prev => prev.includes(label) ? prev.filter(k => k !== label) : [...prev, label]);
  }, []);

  const onLegendKeyDown = useCallback((e: React.KeyboardEvent, label: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleKey(label);
    }
  }, [onToggleKey]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tooltipSide, setTooltipSide] = useState<'left' | 'right'>('right');

  const onPieEnter = useCallback((_: any, index: number, e?: any) => {
    setHoverIndex(index);

    try {
      const rect = containerRef.current?.getBoundingClientRect();
      let localX: number | undefined;

      if (e && typeof e.chartX === 'number') {
        localX = e.chartX;
      } else if (e && e.event && typeof e.event.clientX === 'number' && rect) {
        localX = e.event.clientX - rect.left;
      }

      if (rect && typeof localX === 'number') {
        setTooltipSide(localX > rect.width / 2 ? 'left' : 'right');
      }
    } catch (err) {
      // ignore positioning errors
    }
  }, []);

  const onPieLeave = useCallback(() => {
    setHoverIndex(undefined);
  }, []);

  const onPieClick = useCallback((_: any, index: number, e?: any) => {
    setSelectedIndex(prev => prev === index ? undefined : index);

    // Also update tooltip side when clicking (for keyboard users the side remains default)
    try {
      const rect = containerRef.current?.getBoundingClientRect();
      let localX: number | undefined;

      if (e && typeof e.chartX === 'number') {
        localX = e.chartX;
      } else if (e && e.event && typeof e.event.clientX === 'number' && rect) {
        localX = e.event.clientX - rect.left;
      }

      if (rect && typeof localX === 'number') {
        setTooltipSide(localX > rect.width / 2 ? 'left' : 'right');
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const activeIndex = hoverIndex !== undefined ? hoverIndex : selectedIndex;

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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="h-full"
    >
      <Card className="h-full bg-white/60 dark:bg-black/60 backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden group hover:shadow-2xl" id={id}>
        <CardHeader className="pb-2 flex items-start justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {title}
          </CardTitle>
          <div className="text-xs text-muted-foreground self-center">
            <button className="underline" onClick={() => { setVisibleKeys(initialKeys); setSelectedIndex(undefined); setHoverIndex(undefined); }}>Restablecer</button>
          </div>
        </CardHeader>
        <CardContent className="h-72">
          <ChartContainer config={config} className="w-full h-full">
            <div className="relative w-full h-full" ref={containerRef}>
              <ResponsiveContainer>
                <PieChart>
                {filteredData.length === 0 ? (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm text-muted-foreground">Todos los segmentos están ocultos</text>
                ) : (
                  <Pie
                    data={filteredData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={70}
                    outerRadius={96}
                    paddingAngle={4}
                    stroke="none"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    onClick={onPieClick}
                    className="cursor-pointer"
                    animationBegin={0}
                    animationDuration={700}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.label}`}
                        fill={entry.fill}
                        className="transition-all duration-300 hover:opacity-90"
                        style={{ filter: `drop-shadow(0px 6px 18px ${entry.fill}33)` }}
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null;
                        const cx = viewBox.cx as number;
                        const cy = viewBox.cy as number;
                        if (activeIndex !== undefined && filteredData[activeIndex]) {
                          const slice = filteredData[activeIndex];
                          const percent = total > 0 ? (slice.count / total) * 100 : 0;
                          return (
                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={cx} y={cy - 10} className="text-2xl font-bold fill-foreground">{slice.count.toLocaleString()}</tspan>
                              <tspan x={cx} y={cy + 10} className="text-xs font-medium fill-muted-foreground uppercase tracking-widest">{slice.label} • {percent.toFixed(0)}%</tspan>
                            </text>
                          );
                        }
                      </PieChart>
                      </ResponsiveContainer>

                      {/* Tooltip flotante lateral: siempre fuera del donut, evita solapamiento central */}
                      {activeIndex !== undefined && filteredData[activeIndex] && (
                        <div
                          className={`hidden sm:block absolute top-1/2 z-30 transform -translate-y-1/2 ${
                            tooltipSide === 'right' ? 'right-4' : 'left-4'
                          }`}
                        >
                          <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
                            <div className="font-medium">{filteredData[activeIndex].label}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Usuarios</span>
                              <span className="font-mono font-medium tabular-nums text-foreground">{filteredData[activeIndex].count.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                            <tspan x={cx} y={cy - 8} className="text-3xl font-bold fill-foreground">{total.toLocaleString()}</tspan>
                            <tspan x={cx} y={cy + 14} className="text-xs font-medium fill-muted-foreground uppercase tracking-widest">Total</tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                )}
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>

        <div className="flex justify-center gap-4 pb-4 px-4 overflow-x-auto items-center">
          <AnimatePresence>
            {data.map((entry, i) => {
              const visible = visibleKeys.includes(entry.label);
              const index = filteredData.findIndex(d => d.label === entry.label);
              const isActive = index === activeIndex;
              return (
                <motion.div key={entry.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleKey(entry.label)}
                    onKeyDown={(e) => onLegendKeyDown(e, entry.label)}
                    aria-pressed={visible}
                    title={`${entry.label} - ${entry.count}`}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className={`w-3 h-3 rounded-full transition-opacity ${visible ? '' : 'opacity-30'}`} style={{ backgroundColor: entry.fill }} />
                    <span className={cn(
                      "text-[10px] font-medium uppercase tracking-tighter truncate max-w-[90px]",
                      isActive ? "text-foreground" : visible ? "text-muted-foreground" : "text-muted-foreground/60"
                    )}>{entry.label}</span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
