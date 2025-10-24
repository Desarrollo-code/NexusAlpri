
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

const gaugeVariants = cva('text-foreground', {
  variants: {
    size: {
      sm: 'h-16 w-32 text-xs',
      md: 'h-24 w-48 text-base',
      lg: 'h-32 w-64 text-lg',
      xl: 'h-40 w-80 text-xl', // New size
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
  ({ value, size = 'lg', strokeWidth = 14, className, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const sizeMap = { sm: {w: 128, h: 64}, md: {w: 192, h: 96}, lg: {w: 256, h: 128}, xl: {w: 320, h: 160} };
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

    const backgroundArc = describeArc(cx, cy, radius, -180, 0);
    const valueArc = describeArc(cx, cy, radius, -180, -180 + clampedValue);

    return (
      <div className="relative" style={{ width: chartWidth, height: chartHeight + strokeWidth }}>
        <svg
          ref={ref}
          width={chartWidth}
          height={chartHeight + strokeWidth}
          viewBox={`0 0 ${chartWidth} ${chartHeight + strokeWidth}`}
          className={cn(className)}
          {...props}
        >
          {/* Gradient Definition */}
          <defs>
             <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
             </linearGradient>
          </defs>

          {/* Background Arc */}
          <path d={backgroundArc} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          
          {/* Value Arc */}
          <motion.path
             d={backgroundArc} // Draw the full arc path
             fill="none"
             stroke="url(#gauge-gradient)"
             strokeWidth={strokeWidth}
             strokeLinecap="round"
             initial={{ pathLength: 0 }}
             animate={{ pathLength: clampedValue / 100 }}
             transition={{ duration: 1.5, ease: "easeInOut" }}
          />

           {/* Needle */}
           <motion.g
             initial={{ rotate: -90 }}
             animate={{ rotate: angle - 90 }}
             transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.5 }}
             transform-origin={`${cx}px ${cy}px`}
           >
              <path d={`M ${cx} ${cy} L ${cx} ${cy - radius - 8}`} stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round"/>
              <circle cx={cx} cy={cy} r={6} fill="hsl(var(--foreground))" />
           </motion.g>
        </svg>
      </div>
    );
  }
);
GaugeChart.displayName = 'GaugeChart';

export { GaugeChart };
