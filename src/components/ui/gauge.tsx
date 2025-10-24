
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

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
        const startRadius = radius - strokeWidth / 2 + 2;
        const endRadius = radius + strokeWidth / 2 - 2;
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
        
        const isMajorTick = tickValue % 20 === 0 || tickValue === 10 || tickValue === 30 || tickValue === 50 || tickValue === 70 || tickValue === 90;

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
          height={chartHeight + strokeWidth + 20}
          viewBox={`0 -20 ${chartWidth} ${chartHeight + strokeWidth + 20}`}
          className={cn(className)}
          {...props}
        >
          <defs>
             <linearGradient id="gauge-gradient-colors" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" /> {/* green */}
                <stop offset="50%" stopColor="#f59e0b" /> {/* yellow */}
                <stop offset="100%" stopColor="#ef4444" /> {/* red */}
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
                   <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="hsl(var(--background))" strokeWidth={1.5} />
                   {tick.isMajor && (
                      <text x={tick.lx} y={tick.ly} textAnchor="middle" dy=".3em" fill="hsl(var(--muted-foreground))" fontSize={12} fontWeight="bold">
                        {tick.value}
                      </text>
                   )}
               </g>
           ))}

           {/* Needle */}
           <motion.g
             initial={{ rotate: -90 }}
             animate={{ rotate: angle - 90 }}
             transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
             transform-origin={`${cx}px ${cy}px`}
           >
              <path d={`M ${cx - 5} ${cy} L ${cx} ${cy - radius - 5} L ${cx + 5} ${cy} Z`} fill="hsl(var(--foreground))" />
              <circle cx={cx} cy={cy} r={8} fill="hsl(var(--foreground))" stroke="hsl(var(--muted))" strokeWidth="3"/>
           </motion.g>
        </svg>
      </div>
    );
  }
);
GaugeChart.displayName = 'GaugeChart';

export { GaugeChart };
