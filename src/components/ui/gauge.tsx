
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface GaugeChartProps {
  value: number;
  size?: number;
  gaugePrimaryColor?: string;
  gaugeBackgroundColor?: string;
  className?: string;
}

export function GaugeChart({
  value,
  size = 150,
  gaugePrimaryColor,
  gaugeBackgroundColor,
  className,
}: GaugeChartProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const chartConfig = {
    value: {
      label: 'Value',
    },
    gauge: {
      label: 'Gauge',
      color: gaugePrimaryColor,
    },
    background: {
      label: 'Background',
      color: gaugeBackgroundColor,
    },
  } satisfies ChartConfig;

  const r = (size - 20) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('mx-auto aspect-square h-full w-full', className)}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="transparent"
          stroke={gaugeBackgroundColor ?? 'hsl(var(--muted))'}
          strokeWidth="15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="transparent"
          stroke={gaugePrimaryColor ?? 'hsl(var(--primary))'}
          strokeWidth="15"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease 0s' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="fill-foreground text-2xl font-bold"
        >
          {`${clampedValue.toFixed(0)}%`}
        </text>
      </svg>
    </ChartContainer>
  );
}
