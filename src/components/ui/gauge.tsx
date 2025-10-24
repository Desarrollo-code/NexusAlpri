
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';

const gaugeVariants = cva('text-foreground', {
  variants: {
    size: {
      sm: 'h-24 w-48 text-xs',
      md: 'h-32 w-64 text-base',
      lg: 'h-40 w-80 text-lg',
      xl: 'h-48 w-96 text-xl',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

interface GaugeChartProps extends React.SVGProps<SVGSVGElement>, VariantProps<typeof gaugeVariants> {
  value: number;
  strokeWidth?: number;
}

const GaugeChart = React.forwardRef<SVGSVGElement, GaugeChartProps>(
  ({ value, size = 'lg', strokeWidth = 20, className, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const sizeMap = { sm: {w: 192, h: 96}, md: {w: 256, h: 128}, lg: {w: 320, h: 160}, xl: {w: 384, h: 192} };
    const { w: chartWidth, h: chartHeight } = sizeMap[size || 'lg'];
    
    const animatedValue = useAnimatedCounter(clampedValue, 0, 1000);

    const cx = chartWidth / 2;
    const cy = chartHeight;
    const radius = chartWidth / 2 - strokeWidth / 2;

    const valueToAngle = (v: number) => -180 + (v / 100) * 180;
    const angle = valueToAngle(clampedValue);

    const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
        const start = {
            x: x + r * Math.cos(startAngle * Math.PI / 180),
            y: y + r * Math.sin(startAngle * Math.PI / 180)
        };
        const end = {
            x: x + r * Math.cos(endAngle * Math.PI / 180),
            y: y + r * Math.sin(endAngle * Math.PI / 180)
        };
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    const valueArc = describeArc(cx, cy, radius, -180, angle);

    const ticks = Array.from({ length: 11 }, (_, i) => {
        const tickValue = i * 10;
        const tickAngle = valueToAngle(tickValue);
        const startRadius = radius - strokeWidth / 2;
        const endRadius = radius + strokeWidth / 2;
        const labelRadius = radius + strokeWidth / 2 + 10;

        const startPoint = {
            x: cx + startRadius * Math.cos(tickAngle * Math.PI / 180),
            y: cy + startRadius * Math.sin(tickAngle * Math.PI / 180)
        };
        const endPoint = {
            x: cx + endRadius * Math.cos(tickAngle * Math.PI / 180),
            y: cy + endRadius * Math.sin(tickAngle * Math.PI / 180)
        };
        const labelPoint = {
            x: cx + labelRadius * Math.cos(tickAngle * Math.PI / 180),
            y: cy + labelRadius * Math.sin(tickAngle * Math.PI / 180)
        };
        
        const isMajorTick = tickValue % 20 === 0;

        return {
            x1: startPoint.x, y1: startPoint.y,
            x2: endPoint.x, y2: endPoint.y,
            lx: labelPoint.x, ly: labelPoint.y,
            value: tickValue,
            isMajor: isMajorTick
        };
    });


    return (
      <div className="relative" style={{ width: chartWidth, height: chartHeight + strokeWidth }}>
        <svg
          ref={ref}
          width={chartWidth}
          height={chartHeight + strokeWidth}
          viewBox={`0 -5 ${chartWidth} ${chartHeight + strokeWidth + 5}`}
          className={cn(className)}
          {...props}
        >
          <defs>
             <linearGradient id="gauge-gradient-colors" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
             </linearGradient>
          </defs>

          {/* Background Arc */}
          <path d={describeArc(cx, cy, radius, -180, 0)} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          
          {/* Value Arc */}
          <path
             d={valueArc}
             fill="none"
             stroke="url(#gauge-gradient-colors)"
             strokeWidth={strokeWidth}
             strokeLinecap="round"
          />

           {/* Ticks and Labels */}
           {ticks.map((tick, i) => (
               <g key={i}>
                   <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="hsl(var(--background))" strokeWidth={2} />
                   {tick.isMajor && (
                      <text x={tick.lx} y={tick.ly} textAnchor="middle" dy=".3em" fill="hsl(var(--muted-foreground))" fontSize={10} fontWeight="bold">
                        {tick.value}
                      </text>
                   )}
               </g>
           ))}
            <text x={cx} y={cy - 10} textAnchor="middle" className="text-4xl font-bold fill-foreground">
                {animatedValue}%
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" className="text-sm font-medium fill-muted-foreground">
                Índice de Salud
            </text>
        </svg>
      </div>
    );
  }
);
GaugeChart.displayName = 'GaugeChart';

export { GaugeChart };
