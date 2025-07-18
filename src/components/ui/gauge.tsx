
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const gaugeVariants = cva('text-foreground', {
  variants: {
    size: {
      sm: 'h-16 w-16 text-xs',
      md: 'h-24 w-24 text-base',
      lg: 'h-32 w-32 text-lg',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface GaugeChartProps extends React.SVGProps<SVGSVGElement>, VariantProps<typeof gaugeVariants> {
  value: number;
  strokeWidth?: number;
}

const GaugeChart = React.forwardRef<SVGSVGElement, GaugeChartProps>(
  ({ value, size = 'md', strokeWidth = 8, className, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const sizeMap = { sm: 64, md: 96, lg: 128 };
    const chartSize = sizeMap[size || 'md'];
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedValue / 100) * circumference;

    const getColorClass = (val: number) => {
      if (val < 40) return 'text-gauge-green'; // Lower is better for dropout rate
      if (val < 70) return 'text-gauge-yellow';
      return 'text-gauge-red';
    };

    return (
      <div className={cn('relative', gaugeVariants({ size }))}>
        <svg
          ref={ref}
          width={chartSize}
          height={chartSize}
          viewBox={`0 0 ${chartSize} ${chartSize}`}
          className={cn('-rotate-90', className)}
          {...props}
        >
          <circle
            className="text-muted/30"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={chartSize / 2}
            cy={chartSize / 2}
          />
          <circle
            className={cn('transition-colors duration-500', getColorClass(clampedValue))}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={chartSize / 2}
            cy={chartSize / 2}
            style={{ transitionProperty: 'stroke-dashoffset, stroke' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold">{`${clampedValue.toFixed(1)}%`}</span>
        </div>
      </div>
    );
  }
);
GaugeChart.displayName = 'GaugeChart';

export { GaugeChart };
