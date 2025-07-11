
'use client';

import * as React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;
}

export function GaugeChart({ value }: GaugeChartProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const data = [
    { name: 'Value', value: clampedValue, fill: 'hsl(var(--primary))' },
  ];

  const colorRanges = [
    { value: 40, color: 'hsl(var(--gauge-green))' }, // 0-40: Green
    { value: 70, color: 'hsl(var(--gauge-yellow))' }, // 40-70: Yellow
    { value: 100, color: 'hsl(var(--gauge-red))' }, // 70-100: Red
  ];

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer>
        <RadialBarChart
          innerRadius="75%"
          outerRadius="100%"
          barSize={20}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            angleAxisId={0}
            data={data}
            cornerRadius={10}
          >
            {colorRanges.map((range, index) => (
              <Cell key={`cell-${index}`} fill={range.color} />
            ))}
          </RadialBar>
          {/* Needle */}
          <g>
            <path
              d="M 0 -5 L 0 5 L 80 0 Z"
              fill="hsl(var(--foreground))"
              transform={`translate(50%, 100%) rotate(${(clampedValue / 100) * 180})`}
              transform-origin="0 0"
              style={{ transition: 'transform 0.5s ease-out' }}
            />
             <circle cx="50%" cy="100%" r="8" fill="hsl(var(--foreground))" />
          </g>

          <text
            x="50%"
            y="85%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-3xl font-bold"
          >
            {clampedValue.toFixed(1)}%
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
