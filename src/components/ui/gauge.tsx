
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

const gaugeVariants = cva('text-foreground', {
  variants: {
    size: {
      sm: 'h-16 w-16 text-xs',
      md: 'h-24 w-24 text-base',
      lg: 'h-32 w-32 text-lg',
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
  ({ value, size = 'lg', strokeWidth = 10, className, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const sizeMap = { sm: 64, md: 96, lg: 128 };
    const chartSize = sizeMap[size || 'lg'];
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = Math.PI * radius; // Gauge is a semi-circle

    const valueToAngle = (v: number) => (v / 100) * 180;
    const angle = valueToAngle(clampedValue);

    const getColorClass = (val: number) => {
      if (val >= 80) return 'text-green-500';
      if (val >= 40) return 'text-yellow-500';
      return 'text-red-500';
    };
    
    // Path for the gauge arc
    const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
        const start = {
            x: cx + r * Math.cos(startAngle * Math.PI / 180),
            y: cy + r * Math.sin(startAngle * Math.PI / 180)
        };
        const end = {
            x: cx + r * Math.cos(endAngle * Math.PI / 180),
            y: cy + r * Math.sin(endAngle * Math.PI / 180)
        };
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    const backgroundArc = describeArc(chartSize/2, chartSize/2, radius, -180, 0);
    const valueArc = describeArc(chartSize/2, chartSize/2, radius, -180, -180 + angle);

    return (
      <div className="relative" style={{ width: chartSize, height: chartSize / 2 + strokeWidth }}>
        <svg
          ref={ref}
          width={chartSize}
          height={chartSize / 2 + strokeWidth}
          viewBox={`0 0 ${chartSize} ${chartSize/2 + strokeWidth}`}
          className={cn(className)}
          {...props}
        >
          {/* Background Arc */}
          <path d={backgroundArc} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          {/* Value Arc */}
          <path d={valueArc} fill="none" stroke="url(#gauge-gradient)" strokeWidth={strokeWidth} strokeLinecap="round" />
          
          <defs>
             <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
             </linearGradient>
          </defs>
          
           {/* Needle */}
           <motion.g
             initial={{ rotate: -90 }}
             animate={{ rotate: angle - 90 }}
             transition={{ type: "spring", stiffness: 200, damping: 20 }}
             transform-origin="50% 50%"
           >
              <path d={`M ${chartSize / 2} ${chartSize / 2 - radius - 5} L ${chartSize / 2} ${chartSize / 2 - radius + 15}`} stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round"/>
              <circle cx={chartSize/2} cy={chartSize/2} r={4} fill="hsl(var(--foreground))" />
           </motion.g>

        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <span className={cn("text-2xl font-bold", getColorClass(clampedValue))}>
                {`${clampedValue.toFixed(0)}%`}
            </span>
            <p className="text-xs text-muted-foreground">Salud</p>
        </div>
      </div>
    );
  }
);
GaugeChart.displayName = 'GaugeChart';

export { GaugeChart };
